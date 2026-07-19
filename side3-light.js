/* global SelfieSegmentation, Pose */

/*
  SIDE 3 - INTERNAL LIGHT FOUNDATION

  Side 3 owns only its camera/body rendering. It keeps the existing project
  handoff shape used by the other sides, but the visual language here is a
  quiet internal volume of light rather than exterior glow or fracture.
*/

(function () {
  "use strict";

  const SIDE3_CAMERA_WIDTH = 1280;
  const SIDE3_CAMERA_HEIGHT = 720;
  const SIDE3_MAX_RENDER_WIDTH = 640;
  const SIDE3_MAX_RENDER_HEIGHT = 960;
  const SIDE3_MAX_DEVICE_PIXEL_RATIO = 1.5;
  const SIDE3_MOBILE_MAX_RENDER_WIDTH = 560;
  const SIDE3_MOBILE_MAX_RENDER_HEIGHT = 840;
  const SIDE3_MOBILE_TABLET_MAX_RENDER_WIDTH = 600;
  const SIDE3_MOBILE_TABLET_MAX_RENDER_HEIGHT = 900;
  const SIDE3_MOBILE_SEGMENTATION_INTERVAL_MS = 48;
  const SIDE3_MOBILE_AFTERIMAGE_SCALE = 0.58;
  const SIDE3_MOBILE_TABLET_AFTERIMAGE_SCALE = 0.66;
  const SIDE3_MOBILE_AFTERIMAGE_CAPTURE_BLUR_MULTIPLIER = 1.42;
  const SIDE3_MOBILE_AFTERIMAGE_DRAW_BLUR_MULTIPLIER = 1.36;
  const SIDE3_MOBILE_AFTERIMAGE_ALPHA_SCALE = 0.86;
  const SIDE3_POSE_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
  const SIDE3_POSE_FRAME_INTERVAL_MS = 95;
  const SIDE3_LANDMARK_CONFIDENCE = 0.55;

  const SIDE3_START_TRANSFORMATION_TIME = 3000;
  const SIDE3_FINAL_TRANSFORMATION_TIME = 90000;
  const SIDE3_STAGE_INTENSITY = [0, 0.025, 0.14, 0.44, 0.78, 1.0];

  const SIDE3_MASK_SAMPLE_SIZE = 84;
  const SIDE3_MASK_CONFIDENCE_THRESHOLD = 0.42;
  const SIDE3_BODY_PRESENT_MIN_COVERAGE = 0.012;
  const SIDE3_BODY_MISSING_RESET_AFTER_MS = 900;
  const SIDE3_MASK_MISSING_HOLD_MS = 1200;
  const SIDE3_MASK_TEMPORAL_RETENTION = 0.83;
  const SIDE3_MASK_BOUNDS_SMOOTHING = 0.18;

  const SIDE3_DIFFUSE_LIGHT_ALPHA = 0.74;
  const SIDE3_CORE_LIGHT_ALPHA = 0.88;
  const SIDE3_SHELL_MILKINESS = 0.15;
  const SIDE3_INTERNAL_BLUR_MIN = 10;
  const SIDE3_INTERNAL_BLUR_MAX = 46;
  const SIDE3_OUTER_GLOW_ALPHA = 0.66;
  const SIDE3_FACE_OVEREXPOSURE_ALPHA = 0.86;
  const SIDE3_AFTERIMAGE_POOL_SIZE = 26;
  const SIDE3_AFTERIMAGE_MIN_MOTION = 28;
  const SIDE3_AFTERIMAGE_MIN_INTERVAL = 88;
  const SIDE3_AFTERIMAGE_MAX_INTERVAL = 560;
  const SIDE3_AFTERIMAGE_MIN_LIFE = 520;
  const SIDE3_AFTERIMAGE_MAX_LIFE = 7800;
  const SIDE3_LIGHT_VOLUME_MAX = 44;
  const SIDE3_LIGHT_VOLUME_MIN_LIFE = 2600;
  const SIDE3_LIGHT_VOLUME_MAX_LIFE = 9200;
  const SIDE3_LIGHT_RAY_MAX = 8;
  const SIDE3_LIGHT_RAY_MIN_LIFE = 720;
  const SIDE3_LIGHT_RAY_MAX_LIFE = 1600;
  const SIDE3_LIGHT_BURN_MAX = 12;
  const SIDE3_LIGHT_FLASH_MAX = 6;
  const SIDE3_DEBUG = false;

  const SIDE3_MUSIC_BOX_MASTER_VOLUME = 0.36;
  const SIDE3_MUSIC_BOX_BASE_VOLUME = 0.018;
  const SIDE3_MUSIC_BOX_HAND_VOLUME = 0.82;
  const SIDE3_MUSIC_BOX_VOLUME_POWER = 1.38;
  const SIDE3_MUSIC_BOX_VOLUME_SMOOTHING_SECONDS = 0.42;
  const SIDE3_MUSIC_BOX_SPEED_SMOOTHING_SECONDS = 0.26;
  const SIDE3_MUSIC_BOX_MIN_RATE = 0.12;
  const SIDE3_MUSIC_BOX_MAX_RATE = 12.5;
  const SIDE3_MUSIC_BOX_STAGE_VOLUME = [0, 0.018, 0.075, 0.36, 0.72, 1.0];
  const SIDE3_MUSIC_BOX_BASE_STEP_SECONDS = 0.285;
  const SIDE3_MUSIC_BOX_LOOKAHEAD_SECONDS = 0.14;
  const SIDE3_MUSIC_BOX_MAX_NOTES_PER_TICK = 28;
  const SIDE3_MUSIC_BOX_MOBILE_MAX_NOTES_PER_TICK = 20;
  const SIDE3_MUSIC_BOX_NOTE_GAIN = 0.09;
  const SIDE3_MUSIC_BOX_NOTE_DECAY = 0.92;
  const SIDE3_MUSIC_BOX_MIN_NOTE_DECAY = 0.08;

  const SIDE3_MUSIC_BOX_MELODY = [
    84, 81, 79, 76, 79, 81, 84, null,
    86, 84, 81, 79, 76, 74, 76, null,
    79, 81, 84, 88, 86, 84, 81, 79,
    76, 79, 81, 76, 74, 72, null, 72
  ];

  const MANUAL_STAGE_PROGRESS = {
    1: 0.08,
    2: 0.28,
    3: 0.52,
    4: 0.76,
    5: 0.97
  };

  const POSE_LANDMARKS = {
    nose: 0,
    leftEye: 2,
    rightEye: 5,
    mouthLeft: 9,
    mouthRight: 10,
    leftShoulder: 11,
    rightShoulder: 12,
    leftWrist: 15,
    rightWrist: 16,
    leftHip: 23,
    rightHip: 24
  };

  let video = null;
  let canvas = null;
  let ctx = null;
  let stream = null;
  let segmenter = null;
  let poseDetector = null;
  let running = false;
  let segmenting = false;
  let lastSegmentationSentAt = 0;
  let facingMode = "environment";
  let bodyIsPresent = false;
  let lastBodySeenAt = 0;
  let transformationStartTime = 0;
  let manualStage = null;
  let latestProgress = 0;
  let latestMaskCoverage = 0;
  let currentMaskBounds = null;
  let stableMaskBounds = null;
  let stableMaskReady = false;
  let lastStableMaskSeenAt = 0;
  let lastPoseSentAt = 0;
  let latestPosePoints = null;
  let lastVisualFrameAt = 0;
  let previousBodyMotionState = null;
  let previousEchoHandState = { left: null, right: null };
  let latestBodyMotion = 0;
  let latestHandEchoMotion = 0;
  let nextAfterimageAt = 0;
  let afterimagePoolIndex = 0;
  let afterimages = [];
  let luminousVolumes = [];
  let nextLuminousVolumeAt = 0;
  let lightRays = [];
  let nextLightRayAt = 0;
  let lightBurns = [];
  let lightFlashes = [];
  let audioContext = null;
  let audioNodes = null;
  let audioStarted = false;
  let audioTargetVolume = 0;
  let audioTargetSpeed = 0;
  let audioSmoothedVolume = 0;
  let audioSmoothedSpeed = 0;
  let audioLastUpdateAt = 0;
  let nextMusicBoxNoteTime = 0;
  let musicBoxNoteIndex = 0;

  const currentCanvas = document.createElement("canvas");
  const currentCtx = currentCanvas.getContext("2d");
  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  const stableMaskCanvas = document.createElement("canvas");
  const stableMaskCtx = stableMaskCanvas.getContext("2d");
  const stableMaskBufferCanvas = document.createElement("canvas");
  const stableMaskBufferCtx = stableMaskBufferCanvas.getContext("2d");
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = SIDE3_MASK_SAMPLE_SIZE;
  sampleCanvas.height = SIDE3_MASK_SAMPLE_SIZE;
  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  const shellCanvas = document.createElement("canvas");
  const shellCtx = shellCanvas.getContext("2d");
  const lightCanvas = document.createElement("canvas");
  const lightCtx = lightCanvas.getContext("2d");
  const haloCanvas = document.createElement("canvas");
  const haloCtx = haloCanvas.getContext("2d");
  const diffusionCanvas = document.createElement("canvas");
  const diffusionCtx = diffusionCanvas.getContext("2d");
  const afterimageCanvases = Array.from({ length: SIDE3_AFTERIMAGE_POOL_SIZE }, () => document.createElement("canvas"));
  const afterimageContexts = afterimageCanvases.map((targetCanvas) => targetCanvas.getContext("2d"));

  async function start(options = {}) {
    try {
      if (running || stream) stop();

      video = document.getElementById("camera");
      canvas = document.getElementById("renderCanvas");
      ctx = canvas.getContext("2d", { alpha: false });
      facingMode = options.facingMode || facingMode;

      primeAudio();
      ensureCameraIsAvailable();
      ensureSegmentationIsAvailable();
      resizeRenderer();
      await openCamera(facingMode);
      await setupSegmenter();
      await setupPoseTracking();

      running = true;
      resetTransformation();
      runSegmentationLoop();
      window.addEventListener("resize", resizeRenderer);
      window.addEventListener("orientationchange", handleOrientationChange);
      document.addEventListener("keydown", handleKeyboard);

      if (typeof options.onReady === "function") {
        options.onReady();
      }
    } catch (error) {
      if (typeof options.onError === "function") {
        options.onError(error);
      } else {
        throw error;
      }
    }
  }

  function stop() {
    running = false;
    window.removeEventListener("resize", resizeRenderer);
    window.removeEventListener("orientationchange", handleOrientationChange);
    document.removeEventListener("keydown", handleKeyboard);

    const activeStream = stream;
    if (activeStream) {
      activeStream.getTracks().forEach((track) => track.stop());
      if (video && video.srcObject === activeStream) video.srcObject = null;
    }
    stream = null;
    lastSegmentationSentAt = 0;
    lastPoseSentAt = 0;

    if (segmenter && typeof segmenter.close === "function") {
      try {
        segmenter.close();
      } catch (error) {
        console.warn("Side 3 segmentation cleanup skipped.", error);
      }
    }
    segmenter = null;

    if (poseDetector && typeof poseDetector.close === "function") {
      try {
        poseDetector.close();
      } catch (error) {
        console.warn("Side 3 pose cleanup skipped.", error);
      }
    }
    poseDetector = null;

    if (audioContext && audioNodes && audioNodes.master) {
      const time = audioContext.currentTime;
      audioNodes.master.gain.setTargetAtTime(0, time, 0.08);
      if (audioContext.state === "running") {
        audioContext.suspend().catch(() => {});
      }
    }
    audioStarted = false;
  }

  function primeAudio() {
    const AudioConstructor = window.AudioContext || window.webkitAudioContext;
    if (!AudioConstructor) return;

    if (!audioContext) {
      audioContext = new AudioConstructor();
      audioNodes = createMusicBoxGraph(audioContext);
    }

    audioStarted = true;
    audioContext.resume().catch((error) => {
      console.warn("Side 3 music box audio could not be resumed.", error);
    });
  }

  function createMusicBoxGraph(context) {
    const master = context.createGain();
    const highpass = context.createBiquadFilter();
    const lowpass = context.createBiquadFilter();
    const limiter = context.createDynamicsCompressor();

    master.gain.value = 0;
    highpass.type = "highpass";
    highpass.frequency.value = 360;
    highpass.Q.value = 0.48;
    lowpass.type = "lowpass";
    lowpass.frequency.value = 8200;
    lowpass.Q.value = 0.62;
    limiter.threshold.value = -14;
    limiter.knee.value = 10;
    limiter.ratio.value = 4;
    limiter.attack.value = 0.004;
    limiter.release.value = 0.16;

    master.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(limiter);
    limiter.connect(context.destination);

    return {
      master
    };
  }

  function ensureCameraIsAvailable() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("This browser does not provide camera access.");
    }

    if (!window.isSecureContext) {
      throw new Error("Camera access needs HTTPS or localhost.");
    }
  }

  function ensureSegmentationIsAvailable() {
    if (typeof SelfieSegmentation === "undefined") {
      throw new Error("The body segmentation library could not be loaded.");
    }
  }

  async function openCamera(mode) {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }

    stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: { ideal: mode },
        width: { ideal: SIDE3_CAMERA_WIDTH },
        height: { ideal: SIDE3_CAMERA_HEIGHT }
      }
    });

    video.srcObject = stream;
    await video.play();

    if (!video.videoWidth || !video.videoHeight) {
      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });
    }

    resizeRenderer();
  }

  async function setupSegmenter() {
    segmenter = new SelfieSegmentation({
      locateFile: (file) => "https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation/" + file
    });

    segmenter.setOptions({
      modelSelection: 1,
      selfieMode: false
    });

    segmenter.onResults(handleSegmentationResults);
  }

  async function setupPoseTracking() {
    try {
      if (typeof Pose === "undefined") {
        await loadExternalScript(SIDE3_POSE_SCRIPT_URL);
      }

      if (typeof Pose === "undefined") return;

      poseDetector = new Pose({
        locateFile: (file) => "https://cdn.jsdelivr.net/npm/@mediapipe/pose/" + file
      });

      poseDetector.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: SIDE3_LANDMARK_CONFIDENCE,
        minTrackingConfidence: SIDE3_LANDMARK_CONFIDENCE
      });

      poseDetector.onResults(handlePoseResults);
    } catch (error) {
      console.warn("Side 3 pose tracking could not start. Music box controls will stay low.", error);
    }
  }

  function loadExternalScript(url) {
    return new Promise((resolve, reject) => {
      const existing = document.querySelector('script[src="' + url + '"]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = url;
      script.async = true;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  async function runSegmentationLoop() {
    if (!running || segmenting) return;

    segmenting = true;

    while (running) {
      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        try {
          const now = performance.now();
          const segmentationInterval = getSide3SegmentationInterval();
          if (!segmentationInterval || now - lastSegmentationSentAt >= segmentationInterval) {
            lastSegmentationSentAt = now;
            await segmenter.send({ image: video });
            await maybeSendPoseFrame(now);
          }
        } catch (error) {
          console.error(error);
          await wait(120);
        }
      } else {
        await wait(60);
      }

      await nextAnimationFrame();
    }

    segmenting = false;
  }

  async function maybeSendPoseFrame(now) {
    if (!poseDetector || now - lastPoseSentAt < SIDE3_POSE_FRAME_INTERVAL_MS) return;

    lastPoseSentAt = now;

    try {
      await poseDetector.send({ image: video });
    } catch (error) {
      console.warn("Side 3 pose frame failed.", error);
    }
  }

  function handleSegmentationResults(results) {
    if (!running) return;
    const now = performance.now();
    resizeRenderer();
    prepareMask(results.segmentationMask, now);
    updateBodyPresence(now);
    renderFrame(now);
  }

  function handlePoseResults(results) {
    if (!running) return;
    const landmarks = results.poseLandmarks || [];
    latestPosePoints = landmarks.map((landmark, index) => poseLandmarkToCanvasPoint(landmark, index));
  }

  function prepareMask(segmentationMask, now) {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    drawSourceCover(maskCtx, segmentationMask, maskCanvas.width, maskCanvas.height);

    sampleCtx.clearRect(0, 0, SIDE3_MASK_SAMPLE_SIZE, SIDE3_MASK_SAMPLE_SIZE);
    sampleCtx.drawImage(maskCanvas, 0, 0, SIDE3_MASK_SAMPLE_SIZE, SIDE3_MASK_SAMPLE_SIZE);

    const stats = calculateMaskStats(sampleCtx.getImageData(0, 0, SIDE3_MASK_SAMPLE_SIZE, SIDE3_MASK_SAMPLE_SIZE));
    latestMaskCoverage = stats.coverage;
    currentMaskBounds = stats.bounds;
    updateStableMask(now);
  }

  function calculateMaskStats(imageData) {
    const data = imageData.data;
    let weightedCoverage = 0;
    let activeSamples = 0;
    let minX = SIDE3_MASK_SAMPLE_SIZE;
    let minY = SIDE3_MASK_SAMPLE_SIZE;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < SIDE3_MASK_SAMPLE_SIZE; y += 1) {
      for (let x = 0; x < SIDE3_MASK_SAMPLE_SIZE; x += 1) {
        const value = data[(y * SIDE3_MASK_SAMPLE_SIZE + x) * 4] / 255;
        weightedCoverage += value;

        if (value >= SIDE3_MASK_CONFIDENCE_THRESHOLD) {
          activeSamples += 1;
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        }
      }
    }

    if (!activeSamples) {
      return {
        coverage: weightedCoverage / (SIDE3_MASK_SAMPLE_SIZE * SIDE3_MASK_SAMPLE_SIZE),
        bounds: null
      };
    }

    const scaleX = maskCanvas.width / SIDE3_MASK_SAMPLE_SIZE;
    const scaleY = maskCanvas.height / SIDE3_MASK_SAMPLE_SIZE;

    return {
      coverage: weightedCoverage / (SIDE3_MASK_SAMPLE_SIZE * SIDE3_MASK_SAMPLE_SIZE),
      bounds: {
        minX: clamp(Math.floor(minX * scaleX), 0, maskCanvas.width),
        minY: clamp(Math.floor(minY * scaleY), 0, maskCanvas.height),
        maxX: clamp(Math.ceil((maxX + 1) * scaleX), 0, maskCanvas.width),
        maxY: clamp(Math.ceil((maxY + 1) * scaleY), 0, maskCanvas.height)
      }
    };
  }

  function updateStableMask(now) {
    const hasFreshMask = latestMaskCoverage >= SIDE3_BODY_PRESENT_MIN_COVERAGE && currentMaskBounds;

    if (hasFreshMask) {
      stableMaskBufferCtx.clearRect(0, 0, stableMaskBufferCanvas.width, stableMaskBufferCanvas.height);
      stableMaskBufferCtx.drawImage(stableMaskCanvas, 0, 0);

      stableMaskCtx.clearRect(0, 0, stableMaskCanvas.width, stableMaskCanvas.height);
      stableMaskCtx.save();
      stableMaskCtx.globalAlpha = stableMaskReady ? SIDE3_MASK_TEMPORAL_RETENTION : 0;
      stableMaskCtx.drawImage(stableMaskBufferCanvas, 0, 0);
      stableMaskCtx.globalAlpha = stableMaskReady ? 1 - SIDE3_MASK_TEMPORAL_RETENTION : 1;
      stableMaskCtx.filter = "blur(1.6px)";
      stableMaskCtx.drawImage(maskCanvas, 0, 0);
      stableMaskCtx.filter = "none";
      stableMaskCtx.restore();

      stableMaskBounds = stableMaskBounds
        ? smoothMaskBounds(stableMaskBounds, currentMaskBounds, SIDE3_MASK_BOUNDS_SMOOTHING)
        : { ...currentMaskBounds };
      stableMaskReady = true;
      lastStableMaskSeenAt = now;
      return;
    }

    if (!stableMaskReady || now - lastStableMaskSeenAt > SIDE3_MASK_MISSING_HOLD_MS) return;

    stableMaskBufferCtx.clearRect(0, 0, stableMaskBufferCanvas.width, stableMaskBufferCanvas.height);
    stableMaskBufferCtx.drawImage(stableMaskCanvas, 0, 0);
    stableMaskCtx.clearRect(0, 0, stableMaskCanvas.width, stableMaskCanvas.height);
    stableMaskCtx.save();
    stableMaskCtx.globalAlpha = 0.986;
    stableMaskCtx.filter = "blur(0.9px)";
    stableMaskCtx.drawImage(stableMaskBufferCanvas, 0, 0);
    stableMaskCtx.filter = "none";
    stableMaskCtx.restore();
  }

  function smoothMaskBounds(previousBounds, nextBounds, amount) {
    return {
      minX: lerp(previousBounds.minX, nextBounds.minX, amount),
      minY: lerp(previousBounds.minY, nextBounds.minY, amount),
      maxX: lerp(previousBounds.maxX, nextBounds.maxX, amount),
      maxY: lerp(previousBounds.maxY, nextBounds.maxY, amount)
    };
  }

  function updateBodyPresence(now) {
    const hasFreshBody = latestMaskCoverage >= SIDE3_BODY_PRESENT_MIN_COVERAGE;
    const hasHeldBody = stableMaskReady && now - lastStableMaskSeenAt <= SIDE3_MASK_MISSING_HOLD_MS;
    const hasBody = hasFreshBody || hasHeldBody;

    if (hasBody) {
      bodyIsPresent = true;
      if (hasFreshBody) lastBodySeenAt = now;
      if (!transformationStartTime) transformationStartTime = now;
      return;
    }

    if (bodyIsPresent && now - lastBodySeenAt > SIDE3_BODY_MISSING_RESET_AFTER_MS) {
      bodyIsPresent = false;
      resetTransformation();
    }
  }

  function renderFrame(now) {
    const dt = lastVisualFrameAt
      ? clamp((now - lastVisualFrameAt) / 1000, 0.001, 0.08)
      : 0.016;
    lastVisualFrameAt = now;

    resetMainContext();
    drawSourceCover(currentCtx, video, currentCanvas.width, currentCanvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentCanvas, 0, 0);

    if (!bodyIsPresent) {
      previousEchoHandState = { left: null, right: null };
      latestHandEchoMotion = 0;
      setMusicBoxTargets(0, 0);
      updateMusicBoxAudio(now);
      return;
    }

    latestProgress = manualStage ? MANUAL_STAGE_PROGRESS[manualStage] : getTransformationProgress(now);
    latestBodyMotion = updateBodyMotion(dt);
    latestHandEchoMotion = updateHandEchoMotion(dt);
    updateLuminousAfterimages(latestProgress, now, latestBodyMotion, latestHandEchoMotion);
    updateLuminousVolumes(latestProgress, now);
    drawLuminousVolumes(latestProgress, now, "behind");
    drawLuminousAfterimages(latestProgress, now);
    drawInternalVolumetricLight(latestProgress, now);
    drawLuminousVolumes(latestProgress, now, "front");
    updateMusicBoxAudioFromPose(now);

    if (SIDE3_DEBUG) drawDebugOverlay(latestProgress);
  }

  function resetMainContext() {
    if (!ctx) return;
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";
    ctx.imageSmoothingEnabled = true;
    currentCtx.globalAlpha = 1;
    currentCtx.globalCompositeOperation = "source-over";
    currentCtx.filter = "none";
  }

  function drawInternalVolumetricLight(progress, now) {
    const intensity = getLightIntensity(progress);
    if (intensity <= 0.001 || !stableMaskReady) return;

    const bounds = getLocalEffectBounds(74);
    if (!bounds) return;

    const clearBounds = expandBounds(bounds, Math.round(lerp(72, 156, smoothstep(0.3, 1, progress))));
    clearEffectCanvases(clearBounds);

    const pulse = getPressurePulse(now);
    const stagePower = smoothstep(0.02, 1, progress);
    const bodyScale = Math.max(bounds.width, bounds.height);
    const diffusionBlur = clamp(
      bodyScale * lerp(0.018, 0.066, intensity) * (1 + pulse * 0.11),
      SIDE3_INTERNAL_BLUR_MIN,
      SIDE3_INTERNAL_BLUR_MAX
    );

    drawLayeredBodyLight(clearBounds, bounds, progress, intensity, pulse, now);
    drawFrostedBodyShell(clearBounds, intensity, pulse);
    drawDiffuseBodyVolume(clearBounds, bounds, intensity, pulse, diffusionBlur);
    drawPressureCores(clearBounds, bounds, intensity, pulse, now);
    drawFaceOverexposure(clearBounds, bounds, progress, intensity, pulse, now);

    lightCtx.save();
    lightCtx.globalCompositeOperation = "destination-in";
    lightCtx.filter = "blur(" + clamp(diffusionBlur * 0.22, 2, 12) + "px)";
    lightCtx.drawImage(stableMaskCanvas, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    lightCtx.filter = "none";
    lightCtx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = clamp(0.5 + stagePower * 0.36, 0.5, 0.86);
    ctx.drawImage(lightCanvas, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    ctx.restore();

    drawHeadSourceCore(bounds, progress, intensity, pulse, now);
  }

  function drawLayeredBodyLight(clearBounds, bodyBounds, progress, intensity, pulse, now) {
    const escape = smoothstep(0.16, 1, progress);
    if (escape <= 0.001) return;

    const bodyScale = Math.max(bodyBounds.width, bodyBounds.height);
    haloCtx.save();
    haloCtx.clearRect(clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    haloCtx.globalCompositeOperation = "screen";

    drawMaskedLightLayer(clearBounds, bodyBounds, clamp(bodyScale * 0.014, 4, 16), SIDE3_OUTER_GLOW_ALPHA * escape * 0.34, 0.44, 0.3, pulse, now, 0);
    drawMaskedLightLayer(clearBounds, bodyBounds, clamp(bodyScale * lerp(0.03, 0.07, escape), 8, 42), SIDE3_OUTER_GLOW_ALPHA * escape * 0.4, 0.76, 0.35, pulse, now, 1);
    drawMaskedLightLayer(clearBounds, bodyBounds, clamp(bodyScale * lerp(0.078, 0.158, escape), 18, 94), SIDE3_OUTER_GLOW_ALPHA * escape * 0.32, 1.12, 0.43, pulse, now, 2);
    drawMaskedLightLayer(clearBounds, bodyBounds, clamp(bodyScale * lerp(0.13, 0.27, escape), 28, 144), SIDE3_OUTER_GLOW_ALPHA * escape * 0.18, 1.56, 0.52, pulse, now, 3);
    haloCtx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.globalAlpha = clamp(0.22 + escape * 0.58, 0, 0.82);
    ctx.drawImage(haloCanvas, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    ctx.restore();

    drawHeadHaloWaves(bodyBounds, progress, intensity, pulse, now);
  }

  function drawMaskedLightLayer(clearBounds, bodyBounds, blur, alpha, radiusScale, focusY, pulse, now, layerIndex) {
    if (alpha <= 0.001) return;

    const bodyScale = Math.max(bodyBounds.width, bodyBounds.height);
    const face = getFaceLightAnchor(bodyBounds);
    const layer = layerIndex || 0;
    const expand = 1 + layer * 0.013 + Math.sin(now * (0.00012 + layer * 0.000018) + layer * 2.4) * layer * 0.008;
    const offsetX = Math.sin(now * (0.00011 + layer * 0.00002) + layer * 1.9) * bodyScale * layer * 0.008;
    const offsetY = Math.cos(now * (0.00009 + layer * 0.000016) + layer * 2.7) * bodyScale * layer * 0.005;
    const drawWidth = clearBounds.width * expand;
    const drawHeight = clearBounds.height * (1 + (expand - 1) * 0.62);
    const drawX = clearBounds.x - (drawWidth - clearBounds.width) * 0.5 + offsetX;
    const drawY = clearBounds.y - (drawHeight - clearBounds.height) * 0.5 + offsetY;

    diffusionCtx.save();
    diffusionCtx.clearRect(clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    diffusionCtx.beginPath();
    diffusionCtx.rect(clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    diffusionCtx.clip();
    diffusionCtx.filter = "blur(" + blur + "px)";
    diffusionCtx.globalAlpha = alpha * (0.92 + pulse * 0.08);
    diffusionCtx.drawImage(stableMaskCanvas, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height, drawX, drawY, drawWidth, drawHeight);
    diffusionCtx.filter = "none";
    diffusionCtx.globalCompositeOperation = "source-in";

    const gradient = diffusionCtx.createRadialGradient(
      face.x,
      face.y,
      0,
      bodyBounds.minX + (bodyBounds.maxX - bodyBounds.minX) * 0.5,
      bodyBounds.minY + (bodyBounds.maxY - bodyBounds.minY) * focusY,
      bodyScale * radiusScale
    );
    gradient.addColorStop(0, "rgba(255,255,248,0.98)");
    gradient.addColorStop(0.22, "rgba(255,249,225,0.68)");
    gradient.addColorStop(0.58, "rgba(255,237,193,0.25)");
    gradient.addColorStop(1, "rgba(255,224,162,0)");
    diffusionCtx.fillStyle = gradient;
    diffusionCtx.fillRect(clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    diffusionCtx.restore();

    haloCtx.save();
    haloCtx.globalCompositeOperation = "screen";
    haloCtx.drawImage(diffusionCanvas, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    haloCtx.restore();
  }

  function drawHeadSourceCore(bodyBounds, progress, intensity, pulse, now) {
    const corePower = smoothstep(0.36, 1, progress);
    if (corePower <= 0.001) return;

    const width = Math.max(1, bodyBounds.maxX - bodyBounds.minX);
    const height = Math.max(1, bodyBounds.maxY - bodyBounds.minY);
    const bodyScale = Math.max(width, height);
    const face = getFaceLightAnchor(bodyBounds);
    const breathe = 1 + pulse * lerp(0.025, 0.12, corePower) + Math.sin(now * 0.00021 + 1.4) * lerp(0.012, 0.055, corePower);
    const coreRadiusX = width * lerp(0.09, 0.2, corePower) * breathe;
    const coreRadiusY = height * lerp(0.055, 0.13, corePower) * breathe;
    const glowRadius = bodyScale * lerp(0.36, 1.08, corePower) * (1 + pulse * 0.04);

    ctx.save();
    ctx.globalCompositeOperation = "screen";
    const longGlow = ctx.createRadialGradient(face.x, face.y, 0, face.x, face.y + height * 0.1, glowRadius);
    longGlow.addColorStop(0, "rgba(255,255,248," + (0.62 * corePower * intensity).toFixed(4) + ")");
    longGlow.addColorStop(0.18, "rgba(255,250,226," + (0.34 * corePower * intensity).toFixed(4) + ")");
    longGlow.addColorStop(0.52, "rgba(255,238,196," + (0.13 * corePower * intensity).toFixed(4) + ")");
    longGlow.addColorStop(1, "rgba(255,228,174,0)");
    ctx.fillStyle = longGlow;
    ctx.fillRect(face.x - glowRadius, face.y - glowRadius, glowRadius * 2, glowRadius * 2.15);
    ctx.restore();

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.translate(face.x, face.y);
    ctx.rotate(Math.sin(now * 0.00013) * 0.04);
    ctx.scale(coreRadiusX, coreRadiusY);
    const core = ctx.createRadialGradient(0, 0, 0, 0, 0, 1.5);
    const solid = clamp(0.2 + corePower * 0.76, 0, 0.96);
    core.addColorStop(0, "rgba(255,255,253," + solid.toFixed(4) + ")");
    core.addColorStop(0.28, "rgba(255,255,250," + (solid * 0.94).toFixed(4) + ")");
    core.addColorStop(0.52, "rgba(255,250,226," + (solid * 0.42).toFixed(4) + ")");
    core.addColorStop(1, "rgba(255,238,196,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(0, 0, 1.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawHeadHaloWaves(bodyBounds, progress, intensity, pulse, now) {
    const wavePower = smoothstep(0.34, 1, progress);
    if (wavePower <= 0.001) return;

    const width = Math.max(1, bodyBounds.maxX - bodyBounds.minX);
    const height = Math.max(1, bodyBounds.maxY - bodyBounds.minY);
    const bodyScale = Math.max(width, height);
    const face = getFaceLightAnchor(bodyBounds);
    const layerCount = Math.round(lerp(2, 9, wavePower));
    const baseRadius = Math.max(18, Math.min(width, height) * lerp(0.12, 0.22, wavePower));

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let index = 0; index < layerCount; index += 1) {
      const seed = hash1(index + 1, 401);
      const speed = lerp(0.000032, 0.000085, hash1(index, 409));
      const travel = (now * speed + seed + index / Math.max(1, layerCount)) % 1;
      const birth = smoothstep(0, 0.14, travel);
      const dissolve = 1 - smoothstep(0.62, 1, travel);
      const depth = hash1(index, 421);
      const breathe = 1 + Math.sin(now * lerp(0.00018, 0.00042, seed) + seed * 20) * lerp(0.025, 0.13, wavePower) + pulse * 0.035;
      const alpha = wavePower * intensity * birth * dissolve * lerp(0.045, 0.19, wavePower) * lerp(0.58, 1.08, depth);
      if (alpha <= 0.001) continue;

      const x = face.x + Math.sin(index * 2.1 + now * 0.00012) * width * lerp(0.012, 0.055, depth);
      const y = face.y + Math.cos(index * 1.7 + now * 0.0001) * height * lerp(0.008, 0.036, depth);
      const radiusX = baseRadius * lerp(0.78, 4.8, travel) * lerp(0.86, 1.26, depth) * breathe;
      const radiusY = baseRadius * lerp(0.56, 3.1, travel) * lerp(0.82, 1.18, hash1(index, 433)) * breathe;
      const rotation = Math.sin(now * 0.00008 + seed * 18) * 0.22 + lerp(-0.2, 0.2, seed);
      const thickness = clamp(bodyScale * lerp(0.008, 0.026, wavePower) * lerp(0.55, 1.4, seed), 3, 22);
      const blur = clamp(bodyScale * lerp(0.012, 0.04, wavePower) * lerp(0.7, 1.45, depth), 5, 38);

      drawHaloWaveRing(ctx, x, y, radiusX, radiusY, rotation, thickness, blur, alpha);
      if (index % 3 === 0) {
        drawVolumetricCore(ctx, x, y, radiusX * 0.62, radiusY * 0.5, alpha * 0.18, rotation);
      }
    }

    ctx.filter = "none";
    ctx.restore();
  }

  function drawHaloWaveRing(targetCtx, x, y, radiusX, radiusY, rotation, thickness, blur, alpha) {
    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.rotate(rotation);
    targetCtx.filter = "blur(" + blur.toFixed(2) + "px)";
    targetCtx.globalAlpha = clamp(alpha, 0, 0.42);
    targetCtx.lineWidth = thickness;
    targetCtx.strokeStyle = "rgba(255, 247, 219, 0.92)";
    targetCtx.beginPath();
    targetCtx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
    targetCtx.stroke();

    targetCtx.globalAlpha = clamp(alpha * 0.38, 0, 0.18);
    targetCtx.lineWidth = thickness * 0.46;
    targetCtx.strokeStyle = "rgba(255, 255, 248, 0.86)";
    targetCtx.beginPath();
    targetCtx.ellipse(radiusX * 0.03, -radiusY * 0.02, radiusX * 0.78, radiusY * 1.12, 0.08, 0, Math.PI * 2);
    targetCtx.stroke();
    targetCtx.restore();
  }

  function drawFrostedBodyShell(bounds, intensity, pulse) {
    shellCtx.save();
    shellCtx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
    shellCtx.drawImage(currentCanvas, bounds.x, bounds.y, bounds.width, bounds.height, bounds.x, bounds.y, bounds.width, bounds.height);
    shellCtx.globalCompositeOperation = "destination-in";
    shellCtx.filter = "blur(0.7px)";
    shellCtx.drawImage(stableMaskCanvas, bounds.x, bounds.y, bounds.width, bounds.height, bounds.x, bounds.y, bounds.width, bounds.height);
    shellCtx.filter = "none";
    shellCtx.globalCompositeOperation = "source-atop";
    shellCtx.fillStyle = "rgba(255, 242, 216, " + (SIDE3_SHELL_MILKINESS * intensity * (0.8 + pulse * 0.08)).toFixed(4) + ")";
    shellCtx.fillRect(bounds.x, bounds.y, bounds.width, bounds.height);
    shellCtx.restore();

    ctx.save();
    ctx.globalAlpha = clamp(0.18 + intensity * 0.32, 0.18, 0.48);
    ctx.globalCompositeOperation = "source-over";
    ctx.drawImage(shellCanvas, bounds.x, bounds.y, bounds.width, bounds.height, bounds.x, bounds.y, bounds.width, bounds.height);
    ctx.restore();
  }

  function drawDiffuseBodyVolume(clearBounds, bodyBounds, intensity, pulse, diffusionBlur) {
    diffusionCtx.save();
    diffusionCtx.clearRect(clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    diffusionCtx.filter = "blur(" + diffusionBlur + "px)";
    diffusionCtx.globalAlpha = SIDE3_DIFFUSE_LIGHT_ALPHA * intensity * (0.86 + pulse * 0.1);
    diffusionCtx.drawImage(stableMaskCanvas, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    diffusionCtx.filter = "none";
    diffusionCtx.globalCompositeOperation = "source-in";
    diffusionCtx.globalAlpha = 1;
    const gradient = diffusionCtx.createLinearGradient(0, bodyBounds.minY, 0, bodyBounds.maxY);
    gradient.addColorStop(0, "rgba(255, 254, 240, 0.94)");
    gradient.addColorStop(0.18, "rgba(255, 248, 222, 0.86)");
    gradient.addColorStop(0.48, "rgba(255, 239, 200, 0.58)");
    gradient.addColorStop(0.74, "rgba(255, 232, 184, 0.34)");
    gradient.addColorStop(1, "rgba(255, 226, 168, 0.16)");
    diffusionCtx.fillStyle = gradient;
    diffusionCtx.fillRect(clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    diffusionCtx.restore();

    lightCtx.save();
    lightCtx.globalCompositeOperation = "source-over";
    lightCtx.drawImage(diffusionCanvas, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    lightCtx.restore();
  }

  function drawFaceOverexposure(clearBounds, bodyBounds, progress, intensity, pulse, now) {
    const facePower = smoothstep(0.18, 1, progress);
    if (facePower <= 0.001) return;

    const bodyWidth = Math.max(1, bodyBounds.maxX - bodyBounds.minX);
    const bodyHeight = Math.max(1, bodyBounds.maxY - bodyBounds.minY);
    const face = getFaceLightAnchor(bodyBounds);
    const breathe = 1 + pulse * lerp(0.04, 0.17, facePower);
    const upperPower = smoothstep(0.54, 1, progress);
    const finalPower = smoothstep(0.74, 1, progress);

    lightCtx.save();
    lightCtx.globalCompositeOperation = "lighter";
    lightCtx.filter = "blur(" + clamp(bodyWidth * lerp(0.018, 0.064, facePower), 3, 30) + "px)";
    drawVolumetricCore(
      lightCtx,
      face.x + Math.sin(now * 0.0002) * bodyWidth * 0.018,
      face.y,
      bodyWidth * lerp(0.13, 0.34, facePower) * breathe,
      bodyHeight * lerp(0.072, 0.2, facePower) * breathe,
      SIDE3_FACE_OVEREXPOSURE_ALPHA * facePower * (0.7 + intensity * 0.56),
      -0.03
    );
    drawVolumetricCore(
      lightCtx,
      face.x + Math.sin(now * 0.00031 + 1.7) * bodyWidth * 0.012,
      face.y - bodyHeight * 0.018,
      bodyWidth * lerp(0.07, 0.18, facePower) * breathe,
      bodyHeight * lerp(0.04, 0.1, facePower) * breathe,
      clamp(0.24 + finalPower * 0.78, 0, 1) * facePower,
      0.04
    );

    if (upperPower > 0.001) {
      const upperGradient = lightCtx.createLinearGradient(0, bodyBounds.minY, 0, bodyBounds.minY + bodyHeight * 0.64);
      upperGradient.addColorStop(0, "rgba(255,255,248," + (0.52 * upperPower + 0.18 * finalPower).toFixed(4) + ")");
      upperGradient.addColorStop(0.34, "rgba(255,250,226," + (0.38 * upperPower + 0.12 * finalPower).toFixed(4) + ")");
      upperGradient.addColorStop(1, "rgba(255,236,190,0)");
      lightCtx.fillStyle = upperGradient;
      lightCtx.fillRect(clearBounds.x, bodyBounds.minY, clearBounds.width, bodyHeight * 0.7);
    }

    lightCtx.filter = "none";
    lightCtx.restore();
  }

  function drawPressureCores(clearBounds, bodyBounds, intensity, pulse, now) {
    const width = Math.max(1, bodyBounds.maxX - bodyBounds.minX);
    const height = Math.max(1, bodyBounds.maxY - bodyBounds.minY);
    const bodyX = bodyBounds.minX;
    const bodyY = bodyBounds.minY;
    const cx = bodyX + width * 0.5;
    const breathe = 1 + pulse * lerp(0.025, 0.105, intensity);
    const stageScale = lerp(0.72, 1.18, intensity);

    lightCtx.save();
    lightCtx.globalCompositeOperation = "lighter";
    lightCtx.filter = "blur(" + clamp(Math.max(width, height) * lerp(0.006, 0.018, intensity), 2, 18) + "px)";

    drawVolumetricCore(lightCtx, cx + Math.sin(now * 0.00018) * width * 0.025, bodyY + height * 0.2, width * 0.3 * breathe * stageScale, height * 0.15 * breathe, SIDE3_CORE_LIGHT_ALPHA * intensity * 0.78, -0.08);
    drawVolumetricCore(lightCtx, cx + Math.sin(now * 0.00013 + 1.8) * width * 0.035, bodyY + height * 0.38, width * 0.3 * breathe * stageScale, height * 0.15 * breathe, SIDE3_CORE_LIGHT_ALPHA * intensity * 0.56, 0.04);
    drawVolumetricCore(lightCtx, cx + Math.cos(now * 0.00015 + 2.4) * width * 0.025, bodyY + height * 0.54, width * 0.25 * breathe * stageScale, height * 0.16 * breathe, SIDE3_CORE_LIGHT_ALPHA * intensity * 0.4, -0.03);
    drawVolumetricCore(lightCtx, cx, bodyY + height * 0.7, width * 0.21 * breathe * stageScale, height * 0.14 * breathe, SIDE3_CORE_LIGHT_ALPHA * intensity * 0.24, 0.08);

    if (intensity > 0.18) {
      const limbAlpha = SIDE3_CORE_LIGHT_ALPHA * intensity * 0.16;
      drawVolumetricCore(lightCtx, bodyX + width * 0.24, bodyY + height * 0.48, width * 0.15 * breathe, height * 0.24 * breathe, limbAlpha, -0.22);
      drawVolumetricCore(lightCtx, bodyX + width * 0.76, bodyY + height * 0.48, width * 0.15 * breathe, height * 0.24 * breathe, limbAlpha, 0.22);
      drawVolumetricCore(lightCtx, bodyX + width * 0.35, bodyY + height * 0.82, width * 0.13 * breathe, height * 0.22 * breathe, limbAlpha * 0.8, -0.08);
      drawVolumetricCore(lightCtx, bodyX + width * 0.65, bodyY + height * 0.82, width * 0.13 * breathe, height * 0.22 * breathe, limbAlpha * 0.8, 0.08);
    }

    lightCtx.filter = "none";
    lightCtx.restore();

    lightCtx.save();
    lightCtx.globalCompositeOperation = "destination-in";
    lightCtx.drawImage(stableMaskCanvas, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height, clearBounds.x, clearBounds.y, clearBounds.width, clearBounds.height);
    lightCtx.restore();
  }

  function drawVolumetricCore(targetCtx, x, y, radiusX, radiusY, alpha, rotation) {
    const safeAlpha = clamp(alpha, 0, 1);
    if (safeAlpha <= 0.001 || radiusX <= 1 || radiusY <= 1) return;

    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.rotate(rotation);
    targetCtx.scale(radiusX, radiusY);
    const gradient = targetCtx.createRadialGradient(0, 0, 0, 0, 0, 1);
    gradient.addColorStop(0, "rgba(255, 255, 238, " + safeAlpha.toFixed(4) + ")");
    gradient.addColorStop(0.34, "rgba(255, 247, 216, " + (safeAlpha * 0.68).toFixed(4) + ")");
    gradient.addColorStop(0.72, "rgba(255, 231, 176, " + (safeAlpha * 0.2).toFixed(4) + ")");
    gradient.addColorStop(1, "rgba(255, 220, 150, 0)");
    targetCtx.fillStyle = gradient;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, 1, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.restore();
  }

  function getPressurePulse(now) {
    const a = Math.sin(now * 0.00034 + 0.6);
    const b = Math.sin(now * 0.00019 + 3.1) * 0.62;
    const c = Math.sin(now * 0.000073 + 5.2) * 0.38;
    return clamp((a + b + c) / 2.0, -1, 1);
  }

  function getLightIntensity(progress) {
    if (progress < 0.2) return lerp(0.018, SIDE3_STAGE_INTENSITY[1], smoothstep(0, 0.2, progress));
    if (progress < 0.4) return lerp(SIDE3_STAGE_INTENSITY[1], SIDE3_STAGE_INTENSITY[2], smoothstep(0.2, 0.4, progress));
    if (progress < 0.6) return lerp(SIDE3_STAGE_INTENSITY[2], SIDE3_STAGE_INTENSITY[3], smoothstep(0.4, 0.6, progress));
    if (progress < 0.82) return lerp(SIDE3_STAGE_INTENSITY[3], SIDE3_STAGE_INTENSITY[4], smoothstep(0.6, 0.82, progress));
    return lerp(SIDE3_STAGE_INTENSITY[4], SIDE3_STAGE_INTENSITY[5], smoothstep(0.82, 1, progress));
  }

  function getLocalEffectBounds(margin) {
    const source = stableMaskBounds || currentMaskBounds;
    if (!source) return null;

    const x = clamp(Math.floor(source.minX - margin), 0, canvas.width);
    const y = clamp(Math.floor(source.minY - margin), 0, canvas.height);
    const maxX = clamp(Math.ceil(source.maxX + margin), 0, canvas.width);
    const maxY = clamp(Math.ceil(source.maxY + margin), 0, canvas.height);
    const width = Math.max(1, maxX - x);
    const height = Math.max(1, maxY - y);

    return {
      x,
      y,
      width,
      height,
      minX: source.minX,
      minY: source.minY,
      maxX: source.maxX,
      maxY: source.maxY
    };
  }

  function expandBounds(bounds, amount) {
    const x = clamp(Math.floor(bounds.x - amount), 0, canvas.width);
    const y = clamp(Math.floor(bounds.y - amount), 0, canvas.height);
    const maxX = clamp(Math.ceil(bounds.x + bounds.width + amount), 0, canvas.width);
    const maxY = clamp(Math.ceil(bounds.y + bounds.height + amount), 0, canvas.height);

    return {
      x,
      y,
      width: Math.max(1, maxX - x),
      height: Math.max(1, maxY - y)
    };
  }

  function clearEffectCanvases(bounds) {
    shellCtx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
    lightCtx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
    diffusionCtx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
    haloCtx.clearRect(bounds.x, bounds.y, bounds.width, bounds.height);
    shellCtx.globalAlpha = 1;
    shellCtx.globalCompositeOperation = "source-over";
    shellCtx.filter = "none";
    lightCtx.globalAlpha = 1;
    lightCtx.globalCompositeOperation = "source-over";
    lightCtx.filter = "none";
    haloCtx.globalAlpha = 1;
    haloCtx.globalCompositeOperation = "source-over";
    haloCtx.filter = "none";
    diffusionCtx.globalAlpha = 1;
    diffusionCtx.globalCompositeOperation = "source-over";
    diffusionCtx.filter = "none";
  }

  function updateBodyMotion(dt) {
    const source = stableMaskBounds || currentMaskBounds;
    if (!source) {
      previousBodyMotionState = null;
      return 0;
    }

    const width = Math.max(1, source.maxX - source.minX);
    const height = Math.max(1, source.maxY - source.minY);
    const state = {
      x: source.minX + width * 0.5,
      y: source.minY + height * 0.5,
      width,
      height
    };

    if (!previousBodyMotionState) {
      previousBodyMotionState = state;
      return latestBodyMotion * 0.82;
    }

    const centerMotion = Math.hypot(state.x - previousBodyMotionState.x, state.y - previousBodyMotionState.y);
    const scaleMotion = Math.abs(state.width - previousBodyMotionState.width) * 0.18 + Math.abs(state.height - previousBodyMotionState.height) * 0.12;
    const measured = (centerMotion + scaleMotion) / Math.max(0.001, dt);
    previousBodyMotionState = state;

    return latestBodyMotion * 0.76 + measured * 0.24;
  }

  function updateHandEchoMotion(dt) {
    const left = getPosePoint(POSE_LANDMARKS.leftWrist);
    const right = getPosePoint(POSE_LANDMARKS.rightWrist);
    let measured = 0;

    if (left && previousEchoHandState.left) {
      measured = Math.max(measured, Math.hypot(left.x - previousEchoHandState.left.x, left.y - previousEchoHandState.left.y) / Math.max(0.001, dt));
    }

    if (right && previousEchoHandState.right) {
      measured = Math.max(measured, Math.hypot(right.x - previousEchoHandState.right.x, right.y - previousEchoHandState.right.y) / Math.max(0.001, dt));
    }

    previousEchoHandState = {
      left: left ? { x: left.x, y: left.y } : null,
      right: right ? { x: right.x, y: right.y } : null
    };

    const blend = 1 - Math.exp(-dt / 0.045);
    return lerp(latestHandEchoMotion, clamp(measured, 0, 900), blend);
  }

  function updateLuminousAfterimages(progress, now, motion, handMotion) {
    const echoPower = smoothstep(0.2, 1, progress);
    if (echoPower <= 0.002 || !stableMaskReady) return;

    const motionThreshold = lerp(SIDE3_AFTERIMAGE_MIN_MOTION * 1.7, SIDE3_AFTERIMAGE_MIN_MOTION * 0.28, echoPower);
    const handInfluence = clamp(handMotion / Math.max(1, motionThreshold * 8), 0, 1);
    const triggerMotion = Math.max(motion, handMotion * lerp(0.56, 0.82, echoPower));
    if (triggerMotion < motionThreshold || now < nextAfterimageAt) return;

    captureLuminousAfterimage(progress, now, motion);
    const interval = lerp(SIDE3_AFTERIMAGE_MAX_INTERVAL, SIDE3_AFTERIMAGE_MIN_INTERVAL, echoPower);
    nextAfterimageAt = now + interval * lerp(1, 0.58, handInfluence) * lerp(0.72, 1.34, hash1(now, afterimagePoolIndex));
  }

  function captureLuminousAfterimage(progress, now, motion) {
    const echoPower = smoothstep(0.2, 1, progress);
    const targetCanvas = afterimageCanvases[afterimagePoolIndex % afterimageCanvases.length];
    const targetCtx = afterimageContexts[afterimagePoolIndex % afterimageContexts.length];
    const afterimageScaleX = targetCanvas.width / Math.max(1, canvas.width);
    const afterimageScaleY = targetCanvas.height / Math.max(1, canvas.height);
    afterimagePoolIndex += 1;

    targetCtx.clearRect(0, 0, targetCanvas.width, targetCanvas.height);
    targetCtx.save();
    targetCtx.setTransform(afterimageScaleX, 0, 0, afterimageScaleY, 0, 0);
    targetCtx.globalAlpha = 1;
    targetCtx.globalCompositeOperation = "source-over";
    targetCtx.filter = "none";
    targetCtx.filter = "blur(" + (lerp(1.2, 4.8, echoPower) * getSide3AfterimageCaptureBlurMultiplier()).toFixed(2) + "px)";
    targetCtx.drawImage(stableMaskCanvas, 0, 0);
    targetCtx.filter = "none";
    targetCtx.globalCompositeOperation = "source-in";
    const source = stableMaskBounds || currentMaskBounds || { minX: 0, minY: 0, maxX: canvas.width, maxY: canvas.height };
    const face = getFaceLightAnchor(source);
    const bodyScale = Math.max(1, source.maxY - source.minY);
    const bodyWidth = Math.max(1, source.maxX - source.minX);
    const bodyHeight = Math.max(1, source.maxY - source.minY);
    const bodyX = source.minX + bodyWidth * 0.5;
    const gradient = targetCtx.createRadialGradient(face.x, face.y, 0, face.x, face.y + bodyScale * 0.18, bodyScale * lerp(0.38, 0.76, echoPower));
    gradient.addColorStop(0, "rgba(255,255,248," + (0.74 + echoPower * 0.2).toFixed(4) + ")");
    gradient.addColorStop(0.28, "rgba(255,248,220," + (0.38 + echoPower * 0.34).toFixed(4) + ")");
    gradient.addColorStop(1, "rgba(255,226,166," + (0.04 + echoPower * 0.08).toFixed(4) + ")");
    targetCtx.fillStyle = gradient;
    targetCtx.fillRect(0, 0, canvas.width, canvas.height);
    targetCtx.globalCompositeOperation = "source-atop";
    targetCtx.globalAlpha = 0.35 + echoPower * 0.34;
    drawVolumetricCore(
      targetCtx,
      face.x,
      face.y,
      Math.max(24, (source.maxX - source.minX) * lerp(0.14, 0.3, echoPower)),
      Math.max(20, (source.maxY - source.minY) * lerp(0.08, 0.18, echoPower)),
      0.72,
      0
    );
    drawVolumetricCore(
      targetCtx,
      bodyX,
      source.minY + bodyHeight * 0.42,
      bodyWidth * lerp(0.24, 0.46, echoPower),
      bodyHeight * lerp(0.16, 0.32, echoPower),
      0.28 + echoPower * 0.3,
      -0.02
    );
    drawVolumetricCore(
      targetCtx,
      bodyX + Math.sin(now * 0.0003) * bodyWidth * 0.04,
      source.minY + bodyHeight * 0.68,
      bodyWidth * lerp(0.18, 0.34, echoPower),
      bodyHeight * lerp(0.12, 0.24, echoPower),
      0.16 + echoPower * 0.22,
      0.07
    );
    targetCtx.restore();

    const life = lerp(SIDE3_AFTERIMAGE_MIN_LIFE, SIDE3_AFTERIMAGE_MAX_LIFE, echoPower) * lerp(0.75, 1.25, hash1(afterimagePoolIndex, 43));
    const alpha = lerp(0.04, 0.46, echoPower) * clamp(motion / 220, 0.36, 1) * getSide3AfterimageAlphaScale();

    afterimages.push({
      canvas: targetCanvas,
      createdAt: now,
      life,
      alpha,
      blur: lerp(1.5, 10.5, echoPower),
      driftX: (hash1(afterimagePoolIndex, 71) - 0.5) * lerp(1.5, 16, echoPower),
      driftY: -lerp(1, 24, echoPower) * hash1(afterimagePoolIndex, 83)
    });

    if (afterimages.length > SIDE3_AFTERIMAGE_POOL_SIZE) {
      afterimages.shift();
    }
  }

  function drawLuminousAfterimages(progress, now) {
    if (!afterimages.length) return;

    const echoPower = smoothstep(0.2, 1, progress);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let index = afterimages.length - 1; index >= 0; index -= 1) {
      const echo = afterimages[index];
      const age = clamp((now - echo.createdAt) / echo.life, 0, 1);
      if (age >= 1) {
        afterimages.splice(index, 1);
        continue;
      }

      const fade = smoothstep(0, 0.12, age) * (1 - smoothstep(0.68, 1, age));
      ctx.globalAlpha = echo.alpha * fade * (0.5 + echoPower * 0.68);
      ctx.filter = "blur(" + (echo.blur * getSide3AfterimageDrawBlurMultiplier() * smoothstep(0.12, 1, age)).toFixed(2) + "px)";
      ctx.drawImage(echo.canvas, echo.driftX * age, echo.driftY * age, canvas.width, canvas.height);
    }

    ctx.filter = "none";
    ctx.restore();
  }

  function updateLuminousVolumes(progress, now) {
    const volumePower = smoothstep(0.18, 1, progress);
    if (volumePower <= 0.001 || !stableMaskReady) {
      luminousVolumes = luminousVolumes.filter((volume) => now - volume.createdAt < volume.life);
      return;
    }

    for (let index = luminousVolumes.length - 1; index >= 0; index -= 1) {
      if (now - luminousVolumes[index].createdAt > luminousVolumes[index].life) {
        luminousVolumes.splice(index, 1);
      }
    }

    updateLuminousVolumeReactions(progress, now);

    const targetCount = Math.round(lerp(3, SIDE3_LIGHT_VOLUME_MAX, volumePower));
    if (luminousVolumes.length >= targetCount || now < nextLuminousVolumeAt) return;

    const spawnCount = Math.min(2, targetCount - luminousVolumes.length);
    for (let index = 0; index < spawnCount; index += 1) {
      createLuminousVolume(progress, now + index * 13);
    }
    const interval = lerp(1050, 145, volumePower) * lerp(0.72, 1.45, hash1(now, 151));
    nextLuminousVolumeAt = now + interval;
  }

  function createLuminousVolume(progress, now) {
    const volumePower = smoothstep(0.18, 1, progress);
    const source = stableMaskBounds || currentMaskBounds;
    if (!source) return;

    const width = Math.max(1, source.maxX - source.minX);
    const height = Math.max(1, source.maxY - source.minY);
    const bodyScale = Math.max(width, height);
    const seed = hash1(now, luminousVolumes.length + 601);
    const close = seed < 0.58;
    const fromHead = hash1(seed, 89) < lerp(0.12, 0.42, volumePower);

    luminousVolumes.push({
      createdAt: now,
      life: lerp(SIDE3_LIGHT_VOLUME_MIN_LIFE, SIDE3_LIGHT_VOLUME_MAX_LIFE, volumePower) * lerp(0.72, 1.36, hash1(seed, 13)),
      seed,
      depth: hash1(seed, 29),
      fromHead,
      orbitAngle: hash1(seed, 31) * Math.PI * 2,
      orbitSpeed: lerp(-0.00014, 0.00016, hash1(seed, 37)),
      orbitRadiusX: bodyScale * lerp(close ? 0.16 : 0.44, close ? 0.72 : 1.32, hash1(seed, 41)),
      orbitRadiusY: bodyScale * lerp(close ? 0.1 : 0.28, close ? 0.54 : 1.04, hash1(seed, 43)),
      offsetY: bodyScale * lerp(-0.34, 0.36, hash1(seed, 47)),
      radiusX: bodyScale * lerp(0.018, 0.16, hash1(seed, 53)) * lerp(0.46, 1.04, volumePower),
      radiusY: bodyScale * lerp(0.018, 0.148, hash1(seed, 59)) * lerp(0.46, 1.04, volumePower),
      rotation: lerp(-Math.PI, Math.PI, hash1(seed, 61)),
      pulseRate: lerp(0.00018, 0.00058, hash1(seed, 67)),
      driftX: bodyScale * lerp(-0.13, 0.13, hash1(seed, 71)),
      driftY: bodyScale * lerp(-0.1, 0.15, hash1(seed, 73)),
      morph: lerp(0.045, 0.17, hash1(seed, 79)),
      alpha: lerp(0.045, 0.3, hash1(seed, 83)) * lerp(0.46, 1, volumePower),
      reactivity: hash1(seed, 97),
      reactionMode: 0,
      reactionStart: -Infinity,
      reactionLife: 0,
      reactionPushX: 0,
      reactionPushY: 0
    });
  }

  function updateLuminousVolumeReactions(progress, now) {
    const source = stableMaskBounds || currentMaskBounds;
    if (!source || !luminousVolumes.length) return;

    const touchPoints = [
      getPosePoint(POSE_LANDMARKS.leftWrist),
      getPosePoint(POSE_LANDMARKS.rightWrist)
    ].filter(Boolean);
    if (!touchPoints.length) return;

    luminousVolumes.forEach((volume, index) => {
      if (now - volume.reactionStart < volume.reactionLife * 0.72) return;

      const age = clamp((now - volume.createdAt) / volume.life, 0, 1);
      const position = getLuminousVolumePosition(volume, source, now, age);
      const radius = Math.max(volume.radiusX, volume.radiusY) * lerp(0.78, 1.38, volume.depth);
      const touchDistance = touchPoints.reduce((nearest, point) => {
        return Math.min(nearest, Math.hypot(point.x - position.x, point.y - position.y));
      }, Infinity);

      if (touchDistance > radius * 1.16 || hash1(now, index + 907) > volume.reactivity * 0.72 + 0.18) return;

      const nearest = touchPoints.reduce((selected, point) => {
        const distance = Math.hypot(point.x - position.x, point.y - position.y);
        return distance < selected.distance ? { point, distance } : selected;
      }, { point: touchPoints[0], distance: Infinity }).point;
      const angle = Math.atan2(position.y - nearest.y, position.x - nearest.x);

      volume.reactionMode = 1 + Math.floor(hash1(now, index + 919) * 4);
      volume.reactionStart = now;
      volume.reactionLife = lerp(1150, 3200, hash1(now, index + 929));
      volume.reactionPushX = Math.cos(angle) * radius * lerp(0.18, 0.68, hash1(now, index + 937));
      volume.reactionPushY = Math.sin(angle) * radius * lerp(0.18, 0.68, hash1(now, index + 941));
    });
  }

  function getLuminousVolumePosition(volume, source, now, age) {
    const centerX = source.minX + (source.maxX - source.minX) * 0.5;
    const centerY = source.minY + (source.maxY - source.minY) * 0.42;
    const angle = volume.orbitAngle + now * volume.orbitSpeed;
    let x = centerX + Math.cos(angle) * volume.orbitRadiusX + volume.driftX * age;
    let y = centerY + Math.sin(angle * 0.83 + volume.seed) * volume.orbitRadiusY + volume.offsetY + volume.driftY * age;

    if (volume.fromHead) {
      const face = getFaceLightAnchor(source);
      const emergence = smoothstep(0, 0.38, age);
      x = lerp(face.x, x, emergence);
      y = lerp(face.y, y, emergence);
    }

    return { x, y };
  }

  function getLuminousVolumeReaction(volume, now) {
    if (!volume.reactionMode || !Number.isFinite(volume.reactionStart)) {
      return { amount: 0, collapse: 0, dissolve: 0, pulse: 0, drift: 0, age: 0 };
    }

    const age = clamp((now - volume.reactionStart) / Math.max(1, volume.reactionLife), 0, 1);
    if (age >= 1) {
      volume.reactionMode = 0;
      return { amount: 0, collapse: 0, dissolve: 0, pulse: 0, drift: 0, age: 1 };
    }

    const amount = smoothstep(0, 0.16, age) * (1 - smoothstep(0.62, 1, age));
    return {
      amount,
      collapse: volume.reactionMode === 4 ? amount : 0,
      dissolve: volume.reactionMode === 3 ? amount : 0,
      pulse: volume.reactionMode === 2 ? amount : 0,
      drift: volume.reactionMode === 1 ? amount : 0,
      age
    };
  }

  function drawLuminousVolumes(progress, now, layer) {
    const volumePower = smoothstep(0.18, 1, progress);
    if (!luminousVolumes.length || volumePower <= 0.001) return;

    const source = stableMaskBounds || currentMaskBounds;
    if (!source) return;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    luminousVolumes.forEach((volume) => {
      const isFront = volume.depth >= 0.54;
      if ((layer === "front") !== isFront) return;

      const age = clamp((now - volume.createdAt) / volume.life, 0, 1);
      const fade = smoothstep(0, 0.14, age) * (1 - smoothstep(0.68, 1, age));
      if (fade <= 0.001) return;

      const reaction = getLuminousVolumeReaction(volume, now);
      const breathe = 1 + Math.sin(now * volume.pulseRate + volume.seed * 50) * lerp(0.035, 0.145, volumePower) + reaction.pulse * 0.2;
      const position = getLuminousVolumePosition(volume, source, now, age);
      const x = position.x + volume.reactionPushX * reaction.drift;
      const y = position.y + volume.reactionPushY * reaction.drift;
      const depthScale = lerp(0.74, 1.2, volume.depth);
      const alpha = volume.alpha * fade * (layer === "front" ? 0.68 : 0.5) * (0.52 + volumePower * 0.48) * (1 - reaction.dissolve * 0.72);
      const collapseScale = 1 + reaction.collapse * 0.85;

      drawLivingLightVolume(ctx, x, y, volume.radiusX * breathe * depthScale * collapseScale, volume.radiusY * breathe * depthScale * collapseScale, volume.rotation + Math.sin(now * 0.00011 + volume.seed) * 0.22, alpha, volume, now);
      if (reaction.collapse > 0.001) {
        drawVolumeCollapseWaves(x, y, Math.max(volume.radiusX, volume.radiusY) * depthScale, reaction, alpha, volume, now);
      }
    });

    ctx.restore();
  }

  function drawVolumeCollapseWaves(x, y, radius, reaction, alpha, volume, now) {
    const waveCount = 3;
    for (let index = 0; index < waveCount; index += 1) {
      const travel = clamp(reaction.age * 1.35 - index * 0.18, 0, 1);
      const fade = smoothstep(0, 0.18, travel) * (1 - smoothstep(0.58, 1, travel));
      if (fade <= 0.001) continue;

      drawHaloWaveRing(
        ctx,
        x,
        y,
        radius * lerp(0.72, 2.4, travel),
        radius * lerp(0.48, 1.64, travel),
        volume.rotation + Math.sin(now * 0.0002 + index) * 0.3,
        clamp(radius * 0.12, 2, 18),
        clamp(radius * 0.12, 4, 26),
        alpha * reaction.collapse * fade * 0.7
      );
    }
  }

  function drawLivingLightVolume(targetCtx, x, y, radiusX, radiusY, rotation, alpha, volume, now) {
    const safeAlpha = clamp(alpha, 0, 0.48);
    if (safeAlpha <= 0.001 || radiusX <= 1 || radiusY <= 1) return;

    const falloffRadius = 2.45 + volume.morph * 2.2;
    const livingRotation = rotation + Math.sin(now * volume.pulseRate * 0.7 + volume.seed * 23) * 0.05;

    targetCtx.save();
    targetCtx.translate(x, y);
    targetCtx.rotate(livingRotation);
    targetCtx.scale(radiusX, radiusY);
    targetCtx.filter = "blur(" + clamp(lerp(3.2, 1.1, volume.depth) + Math.max(radiusX, radiusY) * 0.0025, 1, 4.6).toFixed(2) + "px)";

    const coreX = Math.sin(now * volume.pulseRate * 0.53 + volume.seed * 17) * 0.05;
    const coreY = Math.cos(now * volume.pulseRate * 0.61 + volume.seed * 29) * 0.045;
    const gradient = targetCtx.createRadialGradient(coreX, coreY, 0, coreX, coreY, falloffRadius);
    gradient.addColorStop(0, "rgba(255,255,252," + (safeAlpha * 0.96).toFixed(4) + ")");
    gradient.addColorStop(0.06, "rgba(255,255,248," + (safeAlpha * 0.64).toFixed(4) + ")");
    gradient.addColorStop(0.18, "rgba(255,251,231," + (safeAlpha * 0.34).toFixed(4) + ")");
    gradient.addColorStop(0.38, "rgba(255,243,211," + (safeAlpha * 0.13).toFixed(4) + ")");
    gradient.addColorStop(0.68, "rgba(255,234,184," + (safeAlpha * 0.028).toFixed(4) + ")");
    gradient.addColorStop(1, "rgba(255,228,170,0)");
    targetCtx.fillStyle = gradient;
    targetCtx.beginPath();
    targetCtx.arc(0, 0, falloffRadius, 0, Math.PI * 2);
    targetCtx.fill();
    targetCtx.restore();
  }

  function updateLightRays(progress, now) {
    const rayPower = smoothstep(0.44, 1, progress);
    if (rayPower <= 0.002 || !stableMaskReady) return;

    if (now >= nextLightRayAt && lightRays.length < SIDE3_LIGHT_RAY_MAX) {
      createLightRay(progress, now);
      const interval = lerp(14000, 3600, rayPower) * lerp(0.65, 1.7, hash1(now, 191));
      nextLightRayAt = now + interval;
    }

    drawLightRays(progress, now);
  }

  function createLightRay(progress, now) {
    const rayPower = smoothstep(0.44, 1, progress);
    const origin = getLightRayOrigin(now);
    const angle = origin.angle + (hash1(now, 271) - 0.5) * lerp(0.18, 0.74, rayPower);
    const bodyScale = getBodyScale();
    const life = lerp(SIDE3_LIGHT_RAY_MIN_LIFE, SIDE3_LIGHT_RAY_MAX_LIFE, hash1(now, 277)) * lerp(0.7, 1.15, rayPower);
    const cameraChance = lerp(0.04, 0.28, smoothstep(0.58, 1, progress));

    lightRays.push({
      x: origin.x,
      y: origin.y,
      angle,
      length: bodyScale * lerp(0.92, 2.45, rayPower) * lerp(0.72, 1.38, hash1(now, 281)),
      startWidth: lerp(1.3, 4.2, rayPower) * lerp(0.72, 1.1, hash1(now, 283)),
      endWidth: bodyScale * lerp(0.08, 0.28, rayPower) * lerp(0.72, 1.22, hash1(now, 287)),
      alpha: lerp(0.18, 0.58, rayPower),
      createdAt: now,
      life,
      seed: hash1(now, 293),
      cameraHit: hash1(now, 307) < cameraChance,
      burned: false
    });
  }

  function drawLightRays(progress, now) {
    if (!lightRays.length) return;

    const burnPower = smoothstep(0.5, 1, progress);

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let index = lightRays.length - 1; index >= 0; index -= 1) {
      const ray = lightRays[index];
      const age = clamp((now - ray.createdAt) / ray.life, 0, 1);
      if (age >= 1) {
        lightRays.splice(index, 1);
        continue;
      }

      const grow = smoothstep(0, 0.22, age);
      const fade = grow * (1 - smoothstep(0.56, 1, age));
      const shimmer = 0.82 + Math.sin(now * 0.014 + ray.seed * 40) * 0.18;
      const length = ray.length * grow;
      const end = drawVolumetricLightRay(ray, length, fade * shimmer, burnPower);

      if (ray.cameraHit && !ray.burned && age > 0.12) {
        ray.burned = true;
        addLightBurn(end.x, end.y, ray, burnPower, now);
      }
    }

    ctx.restore();
  }

  function drawVolumetricLightRay(ray, length, fade, burnPower) {
    const angle = ray.angle;
    const endX = ray.x + Math.cos(angle) * length;
    const endY = ray.y + Math.sin(angle) * length;
    const sideX = Math.cos(angle + Math.PI * 0.5);
    const sideY = Math.sin(angle + Math.PI * 0.5);
    const endWidth = ray.endWidth * (0.42 + burnPower * 0.58);
    const startWidth = ray.startWidth;
    const midX = ray.x + Math.cos(angle) * length * 0.58;
    const midY = ray.y + Math.sin(angle) * length * 0.58;
    const bend = Math.sin(ray.seed * Math.PI * 2) * endWidth * 0.28;

    drawRayRibbon(ray, endX, endY, sideX, sideY, midX - sideY * bend, midY + sideX * bend, startWidth * 5.6, endWidth * 1.55, ray.alpha * fade * 0.34, 18);
    drawRayRibbon(ray, endX, endY, sideX, sideY, midX, midY, startWidth * 1.8, endWidth * 0.52, ray.alpha * fade * 0.82, 4.5);
    drawRayRibbon(ray, endX, endY, sideX, sideY, midX, midY, startWidth * 0.56, endWidth * 0.12, ray.alpha * fade, 0);

    return { x: endX, y: endY };
  }

  function drawRayRibbon(ray, endX, endY, sideX, sideY, midX, midY, startWidth, endWidth, alpha, blur) {
    if (alpha <= 0.001) return;

    const gradient = ctx.createLinearGradient(ray.x, ray.y, endX, endY);
    gradient.addColorStop(0, "rgba(255,255,250,0.98)");
    gradient.addColorStop(0.18, "rgba(255,251,226,0.72)");
    gradient.addColorStop(0.58, "rgba(255,238,190,0.22)");
    gradient.addColorStop(1, "rgba(255,230,170,0)");

    ctx.save();
    ctx.globalAlpha = clamp(alpha, 0, 0.8);
    ctx.filter = blur > 0 ? "blur(" + blur + "px)" : "none";
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.moveTo(ray.x + sideX * startWidth, ray.y + sideY * startWidth);
    ctx.quadraticCurveTo(midX + sideX * endWidth * 0.25, midY + sideY * endWidth * 0.25, endX + sideX * endWidth, endY + sideY * endWidth);
    ctx.lineTo(endX - sideX * endWidth, endY - sideY * endWidth);
    ctx.quadraticCurveTo(midX - sideX * endWidth * 0.22, midY - sideY * endWidth * 0.22, ray.x - sideX * startWidth, ray.y - sideY * startWidth);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function addLightBurn(x, y, ray, burnPower, now) {
    if (burnPower <= 0.01) return;

    lightBurns.push({
      x: clamp(x, 0, canvas.width),
      y: clamp(y, 0, canvas.height),
      radius: lerp(42, 160, burnPower) * lerp(0.7, 1.25, ray.seed),
      alpha: lerp(0.08, 0.32, burnPower),
      createdAt: now,
      life: lerp(780, 2200, burnPower) * lerp(0.82, 1.28, ray.seed)
    });

    lightFlashes.push({
      x: clamp(x, 0, canvas.width),
      y: clamp(y, 0, canvas.height),
      radius: lerp(180, 560, burnPower) * lerp(0.84, 1.22, ray.seed),
      createdAt: now,
      life: lerp(120, 420, burnPower),
      alpha: lerp(0.025, 0.16, burnPower),
      seed: ray.seed
    });

    while (lightBurns.length > SIDE3_LIGHT_BURN_MAX) {
      lightBurns.shift();
    }

    while (lightFlashes.length > SIDE3_LIGHT_FLASH_MAX) {
      lightFlashes.shift();
    }
  }

  function drawLightBurns(progress, now) {
    const burnPower = smoothstep(0.5, 1, progress);
    if ((!lightBurns.length && !lightFlashes.length) || burnPower <= 0.001) return;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (let index = lightFlashes.length - 1; index >= 0; index -= 1) {
      const flash = lightFlashes[index];
      const age = clamp((now - flash.createdAt) / flash.life, 0, 1);
      if (age >= 1) {
        lightFlashes.splice(index, 1);
        continue;
      }

      const fade = smoothstep(0, 0.08, age) * (1 - smoothstep(0.12, 1, age));
      const radius = flash.radius * (1 + age * 0.18);
      const gradient = ctx.createRadialGradient(flash.x, flash.y, 0, flash.x, flash.y, radius);
      gradient.addColorStop(0, "rgba(255,255,248," + (flash.alpha * fade).toFixed(4) + ")");
      gradient.addColorStop(0.28, "rgba(255,248,220," + (flash.alpha * fade * 0.62).toFixed(4) + ")");
      gradient.addColorStop(0.72, "rgba(255,238,190," + (flash.alpha * fade * 0.16).toFixed(4) + ")");
      gradient.addColorStop(1, "rgba(255,232,176,0)");

      ctx.globalAlpha = 1;
      ctx.fillStyle = gradient;
      ctx.fillRect(flash.x - radius, flash.y - radius, radius * 2, radius * 2);
      ctx.globalAlpha = flash.alpha * fade * 0.16;
      ctx.fillStyle = "rgba(255, 252, 236, 1)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }

    ctx.globalAlpha = 1;

    for (let index = lightBurns.length - 1; index >= 0; index -= 1) {
      const burn = lightBurns[index];
      const age = clamp((now - burn.createdAt) / burn.life, 0, 1);
      if (age >= 1) {
        lightBurns.splice(index, 1);
        continue;
      }

      const fade = smoothstep(0, 0.08, age) * (1 - smoothstep(0.16, 1, age));
      const radius = burn.radius * (1 + age * 0.42);
      const gradient = ctx.createRadialGradient(burn.x, burn.y, 0, burn.x, burn.y, radius);
      gradient.addColorStop(0, "rgba(255,255,246," + (burn.alpha * fade).toFixed(4) + ")");
      gradient.addColorStop(0.35, "rgba(255,244,208," + (burn.alpha * fade * 0.42).toFixed(4) + ")");
      gradient.addColorStop(1, "rgba(255,232,178,0)");

      ctx.fillStyle = gradient;
      ctx.fillRect(burn.x - radius, burn.y - radius, radius * 2, radius * 2);
    }

    ctx.restore();
  }

  function getFaceLightAnchor(bodyBounds) {
    const nose = getPosePoint(POSE_LANDMARKS.nose);
    const leftEye = getPosePoint(POSE_LANDMARKS.leftEye);
    const rightEye = getPosePoint(POSE_LANDMARKS.rightEye);
    const mouthLeft = getPosePoint(POSE_LANDMARKS.mouthLeft);
    const mouthRight = getPosePoint(POSE_LANDMARKS.mouthRight);

    const points = [nose, leftEye, rightEye, mouthLeft, mouthRight].filter(Boolean);
    if (points.length) {
      return {
        x: points.reduce((total, point) => total + point.x, 0) / points.length,
        y: points.reduce((total, point) => total + point.y, 0) / points.length
      };
    }

    return {
      x: bodyBounds.minX + (bodyBounds.maxX - bodyBounds.minX) * 0.5,
      y: bodyBounds.minY + (bodyBounds.maxY - bodyBounds.minY) * 0.18
    };
  }

  function getLightRayOrigin(now) {
    const source = stableMaskBounds || currentMaskBounds || { minX: canvas.width * 0.35, minY: canvas.height * 0.2, maxX: canvas.width * 0.65, maxY: canvas.height * 0.8 };
    const width = Math.max(1, source.maxX - source.minX);
    const height = Math.max(1, source.maxY - source.minY);
    const face = getFaceLightAnchor(source);
    const x = face.x + (hash1(now, 337) - 0.5) * width * 0.085;
    const y = face.y + (hash1(now, 341) - 0.5) * height * 0.055;
    const angle = -Math.PI * 0.92 + hash1(now, 347) * Math.PI * 0.84;

    return { x, y, angle };
  }

  function getBodyScale() {
    const source = stableMaskBounds || currentMaskBounds;
    if (!source) return Math.min(canvas.width, canvas.height) * 0.5;
    return Math.max(source.maxX - source.minX, source.maxY - source.minY);
  }

  function updateMusicBoxAudioFromPose(now) {
    const left = getHandHeight("left");
    const right = getHandHeight("right", false);

    setMusicBoxTargets(left, right);
    updateMusicBoxAudio(now);
  }

  function setMusicBoxTargets(volume, speed) {
    audioTargetVolume = clamp(volume, 0, 1);
    audioTargetSpeed = clamp(speed, 0, 1);
  }

  function updateMusicBoxAudio(now) {
    if (!audioContext || !audioNodes) return;

    const dt = audioLastUpdateAt
      ? clamp((now - audioLastUpdateAt) / 1000, 0.001, 0.25)
      : 0.016;
    audioLastUpdateAt = now;

    const volumeBlend = 1 - Math.exp(-dt / SIDE3_MUSIC_BOX_VOLUME_SMOOTHING_SECONDS);
    const speedBlend = 1 - Math.exp(-dt / SIDE3_MUSIC_BOX_SPEED_SMOOTHING_SECONDS);

    audioSmoothedVolume = lerp(audioSmoothedVolume, bodyIsPresent ? audioTargetVolume : 0, volumeBlend);
    audioSmoothedSpeed = lerp(audioSmoothedSpeed, bodyIsPresent ? audioTargetSpeed : 0, speedBlend);

    const time = audioContext.currentTime;
    const presence = smoothstep(0.04, 1, audioSmoothedVolume);
    const stageLimit = bodyIsPresent ? SIDE3_MUSIC_BOX_STAGE_VOLUME[getStage(latestProgress || 0)] : 0;
    const speedGesture = mapMusicBoxSpeedGesture(audioSmoothedSpeed);
    const playbackRate = SIDE3_MUSIC_BOX_MIN_RATE * Math.pow(SIDE3_MUSIC_BOX_MAX_RATE / SIDE3_MUSIC_BOX_MIN_RATE, speedGesture);
    const gain = bodyIsPresent && audioStarted
      ? SIDE3_MUSIC_BOX_MASTER_VOLUME * stageLimit * (
        SIDE3_MUSIC_BOX_BASE_VOLUME
          + SIDE3_MUSIC_BOX_HAND_VOLUME * Math.pow(presence, SIDE3_MUSIC_BOX_VOLUME_POWER)
      )
      : 0;

    audioNodes.master.gain.setTargetAtTime(gain, time, 0.11);

    if (audioStarted && bodyIsPresent) {
      scheduleMusicBoxNotes(time, playbackRate);
    }
  }

  function mapMusicBoxSpeedGesture(rawHeight) {
    const height = clamp(rawHeight, 0, 1);
    const slowRange = smoothstep(0, 0.84, height) * 0.42;
    const aboveHeadRange = smoothstep(0.82, 1, height) * 0.58;
    return clamp(slowRange + aboveHeadRange, 0, 1);
  }

  function scheduleMusicBoxNotes(time, playbackRate) {
    if (!audioContext || !audioNodes) return;

    if (!nextMusicBoxNoteTime || nextMusicBoxNoteTime < time - 0.04) {
      nextMusicBoxNoteTime = time + 0.018;
    }

    let scheduled = 0;
    const lookahead = time + SIDE3_MUSIC_BOX_LOOKAHEAD_SECONDS;
    const stepSeconds = Math.max(0.018, SIDE3_MUSIC_BOX_BASE_STEP_SECONDS / Math.max(0.001, playbackRate));
    const maxNotesPerTick = getSide3MaxNotesPerTick();
    nextMusicBoxNoteTime = Math.min(nextMusicBoxNoteTime, time + stepSeconds);

    while (nextMusicBoxNoteTime < lookahead && scheduled < maxNotesPerTick) {
      const note = SIDE3_MUSIC_BOX_MELODY[musicBoxNoteIndex % SIDE3_MUSIC_BOX_MELODY.length];

      if (Number.isFinite(note)) {
        triggerMusicBoxNote(note, nextMusicBoxNoteTime, playbackRate, musicBoxNoteIndex);
      }

      musicBoxNoteIndex += 1;
      nextMusicBoxNoteTime += stepSeconds;
      scheduled += 1;
    }

    if (scheduled >= maxNotesPerTick && nextMusicBoxNoteTime < time) {
      nextMusicBoxNoteTime = time + stepSeconds;
    }
  }

  function triggerMusicBoxNote(midiNote, startTime, playbackRate, noteIndex) {
    const fundamental = audioContext.createOscillator();
    const tine = audioContext.createOscillator();
    const shimmer = audioContext.createOscillator();
    const noteGain = audioContext.createGain();
    const tineGain = audioContext.createGain();
    const shimmerGain = audioContext.createGain();
    const frequency = midiToFrequency(midiNote);
    const variation = 0.84 + hash1(noteIndex, 17) * 0.24;
    const decay = clamp(
      SIDE3_MUSIC_BOX_NOTE_DECAY / Math.sqrt(Math.max(0.65, playbackRate)),
      SIDE3_MUSIC_BOX_MIN_NOTE_DECAY,
      SIDE3_MUSIC_BOX_NOTE_DECAY
    );
    const peak = SIDE3_MUSIC_BOX_NOTE_GAIN * variation;

    fundamental.type = "sine";
    tine.type = "sine";
    shimmer.type = "triangle";
    fundamental.frequency.setValueAtTime(frequency, startTime);
    tine.frequency.setValueAtTime(frequency * (2.012 + hash1(noteIndex, 31) * 0.018), startTime);
    shimmer.frequency.setValueAtTime(frequency * (3.97 + hash1(noteIndex, 43) * 0.08), startTime);

    noteGain.gain.setValueAtTime(0.0001, startTime);
    noteGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), startTime + 0.006);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay);
    tineGain.gain.setValueAtTime(0.34, startTime);
    tineGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay * 0.74);
    shimmerGain.gain.setValueAtTime(0.15, startTime);
    shimmerGain.gain.exponentialRampToValueAtTime(0.0001, startTime + decay * 0.42);

    fundamental.connect(noteGain);
    tine.connect(tineGain);
    shimmer.connect(shimmerGain);
    tineGain.connect(noteGain);
    shimmerGain.connect(noteGain);
    noteGain.connect(audioNodes.master);

    fundamental.start(startTime);
    tine.start(startTime);
    shimmer.start(startTime);
    fundamental.stop(startTime + decay + 0.08);
    tine.stop(startTime + decay + 0.08);
    shimmer.stop(startTime + decay + 0.08);
  }

  function getHandHeight(side, curved = true) {
    const wrist = getPosePoint(side === "left" ? POSE_LANDMARKS.leftWrist : POSE_LANDMARKS.rightWrist);
    if (!wrist) return 0;

    const leftHip = getPosePoint(POSE_LANDMARKS.leftHip);
    const rightHip = getPosePoint(POSE_LANDMARKS.rightHip);
    const leftShoulder = getPosePoint(POSE_LANDMARKS.leftShoulder);
    const rightShoulder = getPosePoint(POSE_LANDMARKS.rightShoulder);
    const nose = getPosePoint(POSE_LANDMARKS.nose);
    const hipY = leftHip && rightHip ? (leftHip.y + rightHip.y) * 0.5 : canvas.height * 0.72;
    const shoulderY = leftShoulder && rightShoulder ? (leftShoulder.y + rightShoulder.y) * 0.5 : canvas.height * 0.42;
    const torsoHeight = Math.max(48, Math.abs(hipY - shoulderY));
    const highY = nose ? Math.min(nose.y, shoulderY) - torsoHeight * 0.26 : shoulderY - torsoHeight * 0.42;
    const lowY = hipY + torsoHeight * 0.16;
    const range = Math.max(48, lowY - highY);

    const height = clamp((lowY - wrist.y) / range, 0, 1);
    return curved ? smoothstep(0.04, 0.96, height) : height;
  }

  function getPosePoint(index) {
    if (!latestPosePoints) return null;
    const point = latestPosePoints[index];
    return isVisiblePosePoint(point) ? point : null;
  }

  function poseLandmarkToCanvasPoint(landmark, index) {
    if (!video.videoWidth || !video.videoHeight || !canvas.width || !canvas.height) {
      return { x: 0, y: 0, visibility: landmark.visibility ?? 0, index };
    }

    const rect = coverSourceRect(video.videoWidth, video.videoHeight, canvas.width, canvas.height);
    const sourceX = landmark.x * video.videoWidth;
    const sourceY = landmark.y * video.videoHeight;

    return {
      x: ((sourceX - rect.sx) / rect.sw) * canvas.width,
      y: ((sourceY - rect.sy) / rect.sh) * canvas.height,
      visibility: landmark.visibility ?? 0,
      index
    };
  }

  function isVisiblePosePoint(point) {
    return Boolean(
      point
        && Number.isFinite(point.x)
        && Number.isFinite(point.y)
        && point.visibility >= SIDE3_LANDMARK_CONFIDENCE
    );
  }

  function midiToFrequency(note) {
    return 440 * Math.pow(2, (note - 69) / 12);
  }

  function hash1(value, salt = 0) {
    const n = Math.sin(value * 127.1 + salt * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function resetTransformation() {
    transformationStartTime = 0;
    latestProgress = 0;
    manualStage = null;
    bodyIsPresent = false;
    latestMaskCoverage = 0;
    currentMaskBounds = null;
    stableMaskBounds = null;
    stableMaskReady = false;
    lastStableMaskSeenAt = 0;
    lastVisualFrameAt = 0;
    previousBodyMotionState = null;
    previousEchoHandState = { left: null, right: null };
    latestBodyMotion = 0;
    latestHandEchoMotion = 0;
    nextAfterimageAt = 0;
    afterimagePoolIndex = 0;
    afterimages = [];
    luminousVolumes = [];
    nextLuminousVolumeAt = 0;
    lightRays = [];
    nextLightRayAt = 0;
    lightBurns = [];
    lightFlashes = [];
    stableMaskCtx.clearRect(0, 0, stableMaskCanvas.width, stableMaskCanvas.height);
    stableMaskBufferCtx.clearRect(0, 0, stableMaskBufferCanvas.width, stableMaskBufferCanvas.height);
    afterimageContexts.forEach((targetCtx) => {
      targetCtx.clearRect(0, 0, targetCtx.canvas.width, targetCtx.canvas.height);
    });
  }

  function handleKeyboard(event) {
    const key = event.key.toLowerCase();

    if (key >= "1" && key <= "5") {
      manualStage = Number(key);
      latestProgress = MANUAL_STAGE_PROGRESS[manualStage];
    }

    if (key === "r") {
      resetTransformation();
    }
  }

  function handleOrientationChange() {
    window.setTimeout(resizeRenderer, 250);
  }

  function isMobilePerformanceProfile() {
    const userAgent = navigator.userAgent || "";
    const iPadOS = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    const touchDevice = window.matchMedia && window.matchMedia("(pointer: coarse)").matches;
    const smallTouchScreen = touchDevice && Math.min(screen.width || window.innerWidth || 0, screen.height || window.innerHeight || 0) <= 820;
    return iPadOS || /Android|iPhone|iPad|iPod/i.test(userAgent) || smallTouchScreen;
  }

  function isTabletPerformanceProfile() {
    if (!isMobilePerformanceProfile()) return false;
    return Math.min(window.innerWidth || 0, window.innerHeight || 0) >= 700;
  }

  function getSide3MaxRenderWidth() {
    if (!isMobilePerformanceProfile()) return SIDE3_MAX_RENDER_WIDTH;
    return isTabletPerformanceProfile() ? SIDE3_MOBILE_TABLET_MAX_RENDER_WIDTH : SIDE3_MOBILE_MAX_RENDER_WIDTH;
  }

  function getSide3MaxRenderHeight() {
    if (!isMobilePerformanceProfile()) return SIDE3_MAX_RENDER_HEIGHT;
    return isTabletPerformanceProfile() ? SIDE3_MOBILE_TABLET_MAX_RENDER_HEIGHT : SIDE3_MOBILE_MAX_RENDER_HEIGHT;
  }

  function getSide3SegmentationInterval() {
    return isMobilePerformanceProfile() ? SIDE3_MOBILE_SEGMENTATION_INTERVAL_MS : 0;
  }

  function getSide3AfterimageScale() {
    if (!isMobilePerformanceProfile()) return 1;
    return isTabletPerformanceProfile() ? SIDE3_MOBILE_TABLET_AFTERIMAGE_SCALE : SIDE3_MOBILE_AFTERIMAGE_SCALE;
  }

  function getSide3AfterimageCaptureBlurMultiplier() {
    return isMobilePerformanceProfile() ? SIDE3_MOBILE_AFTERIMAGE_CAPTURE_BLUR_MULTIPLIER : 1;
  }

  function getSide3AfterimageDrawBlurMultiplier() {
    return isMobilePerformanceProfile() ? SIDE3_MOBILE_AFTERIMAGE_DRAW_BLUR_MULTIPLIER : 1;
  }

  function getSide3AfterimageAlphaScale() {
    return isMobilePerformanceProfile() ? SIDE3_MOBILE_AFTERIMAGE_ALPHA_SCALE : 1;
  }

  function getSide3MaxNotesPerTick() {
    return isMobilePerformanceProfile() ? SIDE3_MUSIC_BOX_MOBILE_MAX_NOTES_PER_TICK : SIDE3_MUSIC_BOX_MAX_NOTES_PER_TICK;
  }

  function resizeRenderer() {
    if (!canvas) return;

    const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
    const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, SIDE3_MAX_DEVICE_PIXEL_RATIO);
    const scale = Math.min(
      1,
      getSide3MaxRenderWidth() / Math.max(1, viewportWidth * pixelRatio),
      getSide3MaxRenderHeight() / Math.max(1, viewportHeight * pixelRatio)
    );
    const width = Math.max(1, Math.round(viewportWidth * pixelRatio * scale));
    const height = Math.max(1, Math.round(viewportHeight * pixelRatio * scale));

    if (canvas.width === width && canvas.height === height) return;

    [canvas, currentCanvas, maskCanvas, stableMaskCanvas, stableMaskBufferCanvas, shellCanvas, lightCanvas, haloCanvas, diffusionCanvas].forEach((target) => {
      target.width = width;
      target.height = height;
    });
    const afterimageScale = getSide3AfterimageScale();
    afterimageCanvases.forEach((target) => {
      target.width = Math.max(1, Math.round(width * afterimageScale));
      target.height = Math.max(1, Math.round(height * afterimageScale));
    });

    [ctx, currentCtx, maskCtx, stableMaskCtx, stableMaskBufferCtx, shellCtx, lightCtx, haloCtx, diffusionCtx, ...afterimageContexts].forEach((targetCtx) => {
      targetCtx.imageSmoothingEnabled = true;
      targetCtx.globalAlpha = 1;
      targetCtx.globalCompositeOperation = "source-over";
      targetCtx.filter = "none";
    });

    stableMaskReady = false;
    stableMaskBounds = null;
    currentMaskBounds = null;
    lastStableMaskSeenAt = 0;
    previousBodyMotionState = null;
    previousEchoHandState = { left: null, right: null };
    latestHandEchoMotion = 0;
    afterimages = [];
    luminousVolumes = [];
    nextLuminousVolumeAt = 0;
    lightRays = [];
    nextLightRayAt = 0;
    lightBurns = [];
    lightFlashes = [];
  }

  function drawSourceCover(targetCtx, source, destinationWidth, destinationHeight) {
    if (!source || !destinationWidth || !destinationHeight) return;

    const sourceWidth = source.videoWidth || source.width;
    const sourceHeight = source.videoHeight || source.height;
    if (!sourceWidth || !sourceHeight) return;

    const rect = coverSourceRect(sourceWidth, sourceHeight, destinationWidth, destinationHeight);
    targetCtx.drawImage(source, rect.sx, rect.sy, rect.sw, rect.sh, 0, 0, destinationWidth, destinationHeight);
  }

  function coverSourceRect(sourceWidth, sourceHeight, destinationWidth, destinationHeight) {
    const sourceRatio = sourceWidth / sourceHeight;
    const destinationRatio = destinationWidth / destinationHeight;

    if (sourceRatio > destinationRatio) {
      const width = sourceHeight * destinationRatio;
      return {
        sx: (sourceWidth - width) * 0.5,
        sy: 0,
        sw: width,
        sh: sourceHeight
      };
    }

    const height = sourceWidth / destinationRatio;
    return {
      sx: 0,
      sy: (sourceHeight - height) * 0.5,
      sw: sourceWidth,
      sh: height
    };
  }

  function getTransformationProgress(now) {
    if (!transformationStartTime) transformationStartTime = now;

    const elapsed = now - transformationStartTime;
    const duration = Math.max(1, SIDE3_FINAL_TRANSFORMATION_TIME - SIDE3_START_TRANSFORMATION_TIME);

    return clamp((elapsed - SIDE3_START_TRANSFORMATION_TIME) / duration, 0, 1);
  }

  function getStage(progress) {
    if (progress < 0.2) return 1;
    if (progress < 0.4) return 2;
    if (progress < 0.6) return 3;
    if (progress < 0.82) return 4;
    return 5;
  }

  function drawDebugOverlay(progress) {
    ctx.save();
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(10, 10, 118, 52);
    ctx.fillStyle = "white";
    ctx.font = "12px monospace";
    ctx.fillText("Side 3", 18, 30);
    ctx.fillText("Stage " + getStage(progress), 18, 48);
    ctx.restore();
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function smoothstep(edge0, edge1, value) {
    if (edge0 === edge1) return value < edge0 ? 0 : 1;
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function nextAnimationFrame() {
    return new Promise((resolve) => window.requestAnimationFrame(resolve));
  }

  window.Side3Light = {
    start,
    primeAudio,
    stop
  };
}());
