/*
  SIDE 2 - FLUID SIDE

  This file is intentionally separate from app.js. Side 1 remains untouched.
  Side 2 uses the same camera element and canvas, but owns its own segmentation,
  pose loop, rendering, and audio system.
*/

(function () {
  "use strict";

  const SIDE2_POSE_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/pose/pose.js";
  const SIDE2_CAMERA_WIDTH = 1280;
  const SIDE2_CAMERA_HEIGHT = 720;
  const SIDE2_MAX_RENDER_WIDTH = 640;
  const SIDE2_MAX_RENDER_HEIGHT = 960;
  const SIDE2_MAX_DEVICE_PIXEL_RATIO = 1.5;
  const SIDE2_MOBILE_MAX_RENDER_WIDTH = 560;
  const SIDE2_MOBILE_MAX_RENDER_HEIGHT = 840;
  const SIDE2_MOBILE_TABLET_MAX_RENDER_WIDTH = 600;
  const SIDE2_MOBILE_TABLET_MAX_RENDER_HEIGHT = 900;
  const SIDE2_MOBILE_SEGMENTATION_INTERVAL_MS = 48;
  const SIDE2_MASK_SAMPLE_SIZE = 96;
  const SIDE2_BODY_PRESENT_MIN_COVERAGE = 0.012;
  const SIDE2_BODY_MISSING_RESET_AFTER_MS = 2400;
  const SIDE2_MASK_TEMPORAL_RETENTION = 0.72;
  const SIDE2_MASK_MISSING_HOLD_MS = 2200;
  const SIDE2_MASK_BOUNDS_SMOOTHING = 0.22;
  const SIDE2_START_TRANSFORMATION_TIME = 3000;
  const SIDE2_FINAL_TRANSFORMATION_TIME = 90000;
  const SIDE2_POSE_FRAME_INTERVAL_MS = 95;
  const SIDE2_LANDMARK_CONFIDENCE = 0.55;
  const SIDE2_HAND_SMOOTHING_SECONDS = 0.82;
  const SIDE2_MOVEMENT_SMOOTHING_SECONDS = 0.46;
  const SIDE2_STAGE_MAX_AUDIO = [0, 0.08, 0.18, 0.46, 0.76, 1.0];

  const SIDE2_LENS_EFFECT_MARGIN = 124;
  const SIDE2_LENS_MASK_BLUR = 18;
  const SIDE2_LENS_MAX_WIDTH = 300;
  const SIDE2_LENS_MAX_HEIGHT = 450;
  const SIDE2_LENS_MOBILE_MAX_WIDTH = 210;
  const SIDE2_LENS_MOBILE_MAX_HEIGHT = 315;
  const SIDE2_LENS_STAGE_COUNTS = [0, 220, 650, 1180, 1650, 2200];
  const SIDE2_LENS_BODY_COUNT = 1500;
  const SIDE2_LENS_FLOATING_COUNT = 700;
  const SIDE2_LENS_MAX_COUNT = SIDE2_LENS_BODY_COUNT + SIDE2_LENS_FLOATING_COUNT;
  const SIDE2_LENS_RENDER_BIN_SIZE = 28;
  const SIDE2_LENS_MIN_DRAW_RADIUS = 3;
  const SIDE2_LENS_ANCHOR_SMOOTHING_SECONDS = 0.052;
  const SIDE2_LENS_PARAM_SMOOTHING_SECONDS = 0.22;
  const SIDE2_LENS_MAX_SHIFT = 0.24;
  const SIDE2_LENS_EDGE_SOFTNESS = 0.28;
  const SIDE2_LENS_FLOATING_EDGE_SOFTNESS = 0.34;
  const SIDE2_LENS_BUBBLE_EDGE_SOFTNESS = 0.42;
  const SIDE2_LENS_ALPHA = 0.96;
  const SIDE2_LENS_FACE_STRENGTH_BOOST = 1.36;
  const SIDE2_LENS_HAND_STRENGTH_BOOST = 1.3;
  const SIDE2_LENS_DOMINANT_FEATURE_BOOST = 1.26;
  const SIDE2_LENS_MISREGISTRATION_COUNT = 120;
  const SIDE2_LENS_MISREGISTRATION_MAX_BLEND = 0.86;
  const SIDE2_LENS_MISREGISTRATION_DRIFT_SECONDS = 3.4;
  const SIDE2_LENS_BODY_ENVIRONMENT_RATIO = 0.9;
  const SIDE2_LENS_FLOATING_BODY_SAMPLE_RATIO = 0.86;
  const SIDE2_LENS_CRAWLING_COUNT = 320;
  const SIDE2_LENS_RELEASED_ARM_RATIO = 0.54;
  const SIDE2_LENS_RELEASED_HAND_RATIO = 0.5;
  const SIDE2_LENS_RELEASE_MIN_PROGRESS = 0.12;
  const SIDE2_LENS_TORSO_ENVIRONMENT_RATIO = 0.97;
  const SIDE2_LENS_MERGE_MAX_PAIRS = 20;
  const SIDE2_LENS_PIXELATED_EDGE_RATIO = 0.84;
  const SIDE2_LENS_GLITCH_MICRO_MIN_DELAY = 1700;
  const SIDE2_LENS_GLITCH_MICRO_MAX_DELAY = 4200;
  const SIDE2_LENS_GLITCH_GLOBAL_CHANCE = 0.12;
  const SIDE2_LENS_GLITCH_LOCAL_CHANCE = 0.34;
  const SIDE2_LENS_BUBBLE_MAX_COUNT = 18;
  const SIDE2_LENS_BUBBLE_STAGE_LIMITS = [0, 1, 4, 8, 13, 18];
  const SIDE2_LENS_BUBBLE_MIN_LIFETIME = 1500;
  const SIDE2_LENS_BUBBLE_MAX_LIFETIME = 4000;
  const SIDE2_LENS_BUBBLE_HAND_DISTANCE = 20;
  const SIDE2_LENS_BUBBLE_HAND_COOLDOWN = 145;
  const SIDE2_LENS_BUBBLE_SPONTANEOUS_MIN_INTERVAL = 900;
  const SIDE2_LENS_BUBBLE_SPONTANEOUS_MAX_INTERVAL = 2600;
  const SIDE2_EMISSION_FRAGMENT_MAX_COUNT = 34;
  const SIDE2_EMISSION_FRAGMENT_CANVAS_SIZE = 36;
  const SIDE2_EMISSION_MIN_PROGRESS = 0.16;
  const SIDE2_EMISSION_COOLDOWN_MS = 340;
  const SIDE2_EMISSION_MIN_VELOCITY = 190;
  const SIDE2_EMISSION_MIN_ACCELERATION = 1250;
  const SIDE2_LENS_PERF_SAMPLE_INTERVAL = 900;
  const SIDE2_LENS_LOW_FPS_THRESHOLD = 31;
  const SIDE2_LENS_HIGH_FPS_THRESHOLD = 42;
  const SIDE2_LENS_MIN_QUALITY_SCALE = 0.48;
  const SIDE2_LENS_MOBILE_INITIAL_QUALITY = 0.56;
  const SIDE2_LENS_MOBILE_MIN_QUALITY_SCALE = 0.34;
  const SIDE2_LENS_CREATE_BATCH_SIZE = 140;
  const SIDE2_LENS_SOURCE_UPDATE_INTERVAL_MS = 78;
  const SIDE2_LENS_SOURCE_UPDATE_GROUPS = 6;
  const SIDE2_LENS_INTERACTION_INTERVAL_MS = 150;
  const SIDE2_LENS_INTERACTION_CELL_SIZE = 72;
  const SIDE2_LENS_INTERACTION_MAX_CHECKS = 650;
  const SIDE2_FLOATING_FREE_MAX_SPEED = 0.24;
  const SIDE2_FLOATING_FREE_BODY_COLLISION_RADIUS = 1.08;
  const SIDE2_FLOATING_FREE_MIN_PROGRESS = 0.08;
  const SIDE2_LENS_REASSIGN_MIN_PROGRESS = 0.1;
  const SIDE2_LENS_REASSIGN_SCAN_INTERVAL_MS = 260;
  const SIDE2_LENS_REASSIGN_MAX_STARTS = 12;
  const SIDE2_LENS_REASSIGN_MIN_DELAY_MS = 9000;
  const SIDE2_LENS_REASSIGN_MAX_DELAY_MS = 38000;
  const SIDE2_LENS_REASSIGN_MIN_DURATION_MS = 1900;
  const SIDE2_LENS_REASSIGN_MAX_DURATION_MS = 5600;
  const SIDE2_MASK_POSE_GUIDE_MIN_POINTS = 4;
  const SIDE2_MASK_POSE_GUIDE_PADDING_X = 0.28;
  const SIDE2_MASK_POSE_GUIDE_PADDING_Y = 0.2;
  const SIDE2_FIELD_IDLE_PROGRESS = 0.12;
  const SIDE2_FIELD_EDGE_MARGIN = 90;
  const SIDE2_FIELD_SOURCE_DRIFT_SECONDS = 1.28;
  const SIDE2_FIELD_MASK_BLEND_SECONDS = 0.72;
  const SIDE2_FIELD_STAGNATION_SECONDS = 4.8;
  const SIDE2_FIELD_MAX_SPEED = 0.22;
  const SIDE2_FIELD_BASE_SPEED = 0.032;
  const SIDE2_FIELD_BODY_DISTURBANCE = 0.035;
  const SIDE2_FIELD_BOUNDARY_TANGENT = 0.075;
  const SIDE2_FIELD_GLOBAL_PULSE_RATE = 0.00032;
  const SIDE2_FIELD_FOCUS_PULL = 0.118;
  const SIDE2_FIELD_FOCUS_INNER_DISTANCE = 0.42;
  const SIDE2_FIELD_FOCUS_OUTER_DISTANCE = 2.35;
  const SIDE2_FIELD_EDGE_DENSITY_MARGIN = 0.22;
  const SIDE2_FIELD_FACE_COVERAGE_BOOST = 0.92;
  const SIDE2_FIELD_BODY_FOCUS_SMOOTH_SECONDS = 0.34;
  const SIDE2_FIELD_WAKE_TRAIL_SECONDS = 0.72;
  const SIDE2_FIELD_WAKE_DRAG = 0;
  const SIDE2_FIELD_DIRECT_BODY_PULL = 0.026;
  const SIDE2_SKELETON_TRANSPORT_PULL = 0.34;
  const SIDE2_SKELETON_TRANSPORT_FLOW = 0.16;
  const SIDE2_SKELETON_TRANSPORT_WIDTH = 0.105;
  const SIDE2_SKELETON_TRANSPORT_DENSITY = 1.06;
  const SIDE2_SKELETON_SURFACE_FOLLOW_SECONDS = 0.18;
  const SIDE2_SKELETON_DETACHED_FOLLOW_SECONDS = 0.9;
  const SIDE2_LENS_DEBUG = false;

  const SIDE2_AUDIO_MASTER_VOLUME = 1.88;
  const SIDE2_AUDIO_BASE_PRESENCE = 0.16;
  const SIDE2_AUDIO_VOLUME_INTENSITY = 1.08;
  const SIDE2_AUDIO_LOW_FREQUENCY = 28;
  const SIDE2_AUDIO_HIGH_FREQUENCY = 56;
  const SIDE2_AUDIO_PULSE_INTERVAL = 2400;
  const SIDE2_AUDIO_DROP_GAIN = 1.15;
  const SIDE2_AUDIO_RESONANCE_GAIN = 0.68;
  const SIDE2_AUDIO_DECAY_LOW = 1.35;
  const SIDE2_AUDIO_DECAY_HIGH = 8.4;
  const SIDE2_AUDIO_DELAY_LOW = 0.32;
  const SIDE2_AUDIO_DELAY_HIGH = 0.78;
  const SIDE2_AUDIO_FEEDBACK_LOW = 0.06;
  const SIDE2_AUDIO_FEEDBACK_HIGH = 0.64;
  const SIDE2_AUDIO_VISUAL_PULSE_DECAY_MS = 980;

  const POSE_LANDMARKS = {
    nose: 0,
    leftEye: 2,
    rightEye: 5,
    leftMouth: 9,
    rightMouth: 10,
    leftShoulder: 11,
    rightShoulder: 12,
    leftElbow: 13,
    rightElbow: 14,
    leftWrist: 15,
    rightWrist: 16,
    leftHip: 23,
    rightHip: 24,
    leftKnee: 25,
    rightKnee: 26,
    leftAnkle: 27,
    rightAnkle: 28
  };

  const STRUCTURE_LANDMARKS = [
    POSE_LANDMARKS.nose,
    POSE_LANDMARKS.leftShoulder,
    POSE_LANDMARKS.rightShoulder,
    POSE_LANDMARKS.leftElbow,
    POSE_LANDMARKS.rightElbow,
    POSE_LANDMARKS.leftWrist,
    POSE_LANDMARKS.rightWrist,
    POSE_LANDMARKS.leftHip,
    POSE_LANDMARKS.rightHip,
    POSE_LANDMARKS.leftKnee,
    POSE_LANDMARKS.rightKnee,
    POSE_LANDMARKS.leftAnkle,
    POSE_LANDMARKS.rightAnkle
  ];

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
  let lastPoseSentAt = 0;
  let latestPosePoints = null;
  let previousPosePoints = null;
  let latestVisiblePoseCount = 0;
  let latestPoseMotion = 0;
  let latestPoseVelocity = { x: 0, y: 0 };
  let bodyIsPresent = false;
  let lastBodySeenAt = 0;
  let transformationStartTime = 0;
  let manualStage = null;
  let latestProgress = 0;
  let latestMaskPixels = null;
  let latestMaskCoverage = 0;
  let currentMaskBounds = null;
  let stableMaskBounds = null;
  let stableMaskReady = false;
  let lastStableMaskSeenAt = 0;
  let lastVisualFrameAt = 0;
  let side2FieldFocusBounds = null;
  let side2FieldWake = { x: 0, y: 0 };
  let side2Lenses = [];
  let side2LensBubbles = [];
  let side2LensBubbleHands = {
    left: { x: null, y: null, lastSpawnAt: 0 },
    right: { x: null, y: null, lastSpawnAt: 0 }
  };
  let side2EmissionFragments = [];
  let side2EmissionArmState = {
    left: { distance: null, velocity: 0, lastEmitAt: -Infinity },
    right: { distance: null, velocity: 0, lastEmitAt: -Infinity }
  };
  let side2NextSpontaneousBubbleAt = 0;
  let side2LensGuideCache = null;
  let side2BodySourceGuideIndexes = [];
  let side2DrawableLensBuffer = [];
  let side2DrawableLensCount = 0;
  let side2LensRenderBins = { cells: [], cols: 0, rows: 0, binSize: SIDE2_LENS_RENDER_BIN_SIZE };
  let side2LensBinXLookup = [];
  let side2LensBinYLookup = [];
  let side2LensBoundsFadeX = [];
  let side2LensBoundsFadeY = [];
  let side2LensLookupWidth = 0;
  let side2LensLookupHeight = 0;
  let side2LensLookupBinSize = 0;
  let side2LensInteractionBins = { cells: [], cols: 0, rows: 0, cellSize: SIDE2_LENS_INTERACTION_CELL_SIZE };
  let side2LensInteractionCursor = 0;
  let side2LensNextInteractionAt = 0;
  let side2LensRedistributionCursor = 0;
  let side2LensNextRedistributionScanAt = 0;
  let side2LensBubblePool = [];
  let side2LensOutputPixels = null;
  let side2LensOutputWidth = 0;
  let side2LensOutputHeight = 0;
  let side2LensQuality = getSide2InitialLensQuality();
  let side2LensPerfFrameCount = 0;
  let side2LensPerfWindowStartedAt = 0;
  let side2MeasuredLensFps = 0;
  let side2MeasuredLensMs = 0;
  let side2LensGlitchState = {
    active: false,
    level: 0,
    kind: "micro",
    region: "body",
    startedAt: 0,
    duration: 0,
    nextAt: 0,
    seed: 0,
    recoveryUntil: 0,
    recoveryLevel: 0
  };

  let audioContext = null;
  let audioNodes = null;
  let audioStarted = false;
  let audioTargetLeft = 0;
  let audioTargetRight = 0;
  let audioTargetMotion = 0;
  let audioLeft = 0;
  let audioRight = 0;
  let audioMotion = 0;
  let audioLastUpdateAt = 0;
  let nextImpactAt = 0;
  let side2AudioVisualPulse = 0;
  let side2AudioVisualPulseAt = -Infinity;

  const maskCanvas = document.createElement("canvas");
  const maskCtx = maskCanvas.getContext("2d", { willReadFrequently: true });
  const stableMaskCanvas = document.createElement("canvas");
  const stableMaskCtx = stableMaskCanvas.getContext("2d", { willReadFrequently: true });
  const stableMaskBufferCanvas = document.createElement("canvas");
  const stableMaskBufferCtx = stableMaskBufferCanvas.getContext("2d", { willReadFrequently: true });
  const sampleCanvas = document.createElement("canvas");
  sampleCanvas.width = SIDE2_MASK_SAMPLE_SIZE;
  sampleCanvas.height = SIDE2_MASK_SAMPLE_SIZE;
  const sampleCtx = sampleCanvas.getContext("2d", { willReadFrequently: true });
  const currentCanvas = document.createElement("canvas");
  const currentCtx = currentCanvas.getContext("2d");
  const lensMaskCanvas = document.createElement("canvas");
  const lensMaskCtx = lensMaskCanvas.getContext("2d");
  const lensSourceCanvas = document.createElement("canvas");
  const lensSourceCtx = lensSourceCanvas.getContext("2d", { willReadFrequently: true });
  const lensLocalMaskCanvas = document.createElement("canvas");
  const lensLocalMaskCtx = lensLocalMaskCanvas.getContext("2d", { willReadFrequently: true });
  const lensOutputCanvas = document.createElement("canvas");
  const lensOutputCtx = lensOutputCanvas.getContext("2d", { willReadFrequently: true });

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
        console.warn("Side 2 segmentation cleanup skipped.", error);
      }
    }
    segmenter = null;

    if (poseDetector && typeof poseDetector.close === "function") {
      try {
        poseDetector.close();
      } catch (error) {
        console.warn("Side 2 pose cleanup skipped.", error);
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
      audioNodes = createAudioGraph(audioContext);
    }

    audioStarted = true;
    audioContext.resume().catch((error) => {
      console.warn("Side 2 audio could not be resumed.", error);
    });
  }

  function createAudioGraph(context) {
    const master = context.createGain();
    const lowPresence = context.createGain();
    const delay = context.createDelay(1.2);
    const feedback = context.createGain();
    const wet = context.createGain();
    const lowFilter = context.createBiquadFilter();
    const resonator = context.createBiquadFilter();
    const drone = context.createOscillator();
    const droneGain = context.createGain();
    const compressor = context.createDynamicsCompressor();

    master.gain.value = 0;
    lowPresence.gain.value = 1;
    delay.delayTime.value = SIDE2_AUDIO_DELAY_LOW;
    feedback.gain.value = SIDE2_AUDIO_FEEDBACK_LOW;
    wet.gain.value = 0.08;
    lowFilter.type = "lowpass";
    lowFilter.frequency.value = 420;
    lowFilter.Q.value = 0.72;
    resonator.type = "bandpass";
    resonator.frequency.value = 96;
    resonator.Q.value = 5;
    drone.type = "sine";
    drone.frequency.value = SIDE2_AUDIO_LOW_FREQUENCY;
    droneGain.gain.value = 0;
    compressor.threshold.value = -20;
    compressor.knee.value = 26;
    compressor.ratio.value = 3.4;
    compressor.attack.value = 0.018;
    compressor.release.value = 0.48;

    drone.connect(droneGain);
    droneGain.connect(lowFilter);
    lowFilter.connect(lowPresence);
    resonator.connect(master);
    resonator.connect(delay);
    lowPresence.connect(master);
    lowPresence.connect(delay);
    delay.connect(feedback);
    feedback.connect(delay);
    delay.connect(wet);
    wet.connect(master);
    master.connect(compressor);
    compressor.connect(context.destination);
    drone.start();

    return {
      master,
      lowPresence,
      delay,
      feedback,
      wet,
      lowFilter,
      resonator,
      drone,
      droneGain
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
        width: { ideal: SIDE2_CAMERA_WIDTH },
        height: { ideal: SIDE2_CAMERA_HEIGHT }
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
        await loadExternalScript(SIDE2_POSE_SCRIPT_URL);
      }

      if (typeof Pose === "undefined") return;

      poseDetector = new Pose({
        locateFile: (file) => "https://cdn.jsdelivr.net/npm/@mediapipe/pose/" + file
      });

      poseDetector.setOptions({
        modelComplexity: 1,
        smoothLandmarks: true,
        enableSegmentation: false,
        minDetectionConfidence: SIDE2_LANDMARK_CONFIDENCE,
        minTrackingConfidence: SIDE2_LANDMARK_CONFIDENCE
      });

      poseDetector.onResults(handlePoseResults);
    } catch (error) {
      console.warn("Side 2 pose tracking could not start. Continuing mask-only.", error);
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
          const segmentationInterval = getSide2SegmentationInterval();
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
    if (!poseDetector || now - lastPoseSentAt < SIDE2_POSE_FRAME_INTERVAL_MS) return;

    lastPoseSentAt = now;

    try {
      await poseDetector.send({ image: video });
    } catch (error) {
      console.warn("Side 2 pose frame failed.", error);
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
    latestVisiblePoseCount = latestPosePoints.filter(isVisiblePosePoint).length;
    latestPoseMotion = calculatePoseMotion(latestPosePoints, previousPosePoints);
    latestPoseVelocity = calculatePoseVelocity(latestPosePoints, previousPosePoints);
    previousPosePoints = latestPosePoints.map((point) => ({ ...point }));
  }

  function prepareMask(segmentationMask, now) {
    maskCtx.clearRect(0, 0, maskCanvas.width, maskCanvas.height);
    drawSourceCover(maskCtx, segmentationMask, maskCanvas.width, maskCanvas.height);
    sampleCtx.clearRect(0, 0, SIDE2_MASK_SAMPLE_SIZE, SIDE2_MASK_SAMPLE_SIZE);
    sampleCtx.drawImage(maskCanvas, 0, 0, SIDE2_MASK_SAMPLE_SIZE, SIDE2_MASK_SAMPLE_SIZE);
    latestMaskPixels = sampleCtx.getImageData(0, 0, SIDE2_MASK_SAMPLE_SIZE, SIDE2_MASK_SAMPLE_SIZE);
    latestMaskCoverage = calculateMaskCoverage(latestMaskPixels);
    updateStableMask(now);
  }

  function updateStableMask(now) {
    const hasFreshMask = latestMaskCoverage >= SIDE2_BODY_PRESENT_MIN_COVERAGE && currentMaskBounds;

    if (hasFreshMask) {
      stableMaskBufferCtx.clearRect(0, 0, stableMaskBufferCanvas.width, stableMaskBufferCanvas.height);
      stableMaskBufferCtx.drawImage(stableMaskCanvas, 0, 0);

      stableMaskCtx.clearRect(0, 0, stableMaskCanvas.width, stableMaskCanvas.height);
      stableMaskCtx.save();
      stableMaskCtx.globalAlpha = stableMaskReady ? SIDE2_MASK_TEMPORAL_RETENTION : 0;
      stableMaskCtx.drawImage(stableMaskBufferCanvas, 0, 0);
      stableMaskCtx.globalAlpha = stableMaskReady ? 1 - SIDE2_MASK_TEMPORAL_RETENTION : 1;
      stableMaskCtx.filter = "blur(1.5px)";
      stableMaskCtx.drawImage(maskCanvas, 0, 0);
      stableMaskCtx.filter = "none";
      stableMaskCtx.restore();

      stableMaskBounds = stableMaskBounds
        ? smoothMaskBounds(stableMaskBounds, currentMaskBounds, SIDE2_MASK_BOUNDS_SMOOTHING)
        : { ...currentMaskBounds };
      stableMaskReady = true;
      lastStableMaskSeenAt = now;
      return;
    }

    if (!stableMaskReady || now - lastStableMaskSeenAt > SIDE2_MASK_MISSING_HOLD_MS) return;

    stableMaskBufferCtx.clearRect(0, 0, stableMaskBufferCanvas.width, stableMaskBufferCanvas.height);
    stableMaskBufferCtx.drawImage(stableMaskCanvas, 0, 0);
    stableMaskCtx.clearRect(0, 0, stableMaskCanvas.width, stableMaskCanvas.height);
    stableMaskCtx.save();
    stableMaskCtx.globalAlpha = 0.985;
    stableMaskCtx.filter = "blur(0.8px)";
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
    const hasFreshBody = latestMaskCoverage >= SIDE2_BODY_PRESENT_MIN_COVERAGE;
    const hasHeldBody = stableMaskReady && now - lastStableMaskSeenAt <= SIDE2_MASK_MISSING_HOLD_MS;
    const hasBody = hasFreshBody || hasHeldBody;

    if (hasBody) {
      bodyIsPresent = true;
      if (hasFreshBody) lastBodySeenAt = now;
      if (!transformationStartTime) transformationStartTime = now;
      return;
    }

    if (bodyIsPresent && now - lastBodySeenAt > SIDE2_BODY_MISSING_RESET_AFTER_MS) {
      bodyIsPresent = false;
      resetTransformation();
    }
  }

  function resetTransformation() {
    transformationStartTime = 0;
    latestProgress = 0;
    lastVisualFrameAt = 0;
    latestPoseVelocity = { x: 0, y: 0 };
    side2Lenses = [];
    side2LensQuality = getSide2InitialLensQuality();
    side2LensInteractionCursor = 0;
    side2LensNextInteractionAt = 0;
    side2DrawableLensCount = 0;
    side2FieldFocusBounds = null;
    side2FieldWake = { x: 0, y: 0 };
    resetLensBubbles();
    resetOutwardEmissionFragments();
    resetLensGlitchState();
    currentMaskBounds = null;
    stableMaskReady = false;
    stableMaskBounds = null;
    lastStableMaskSeenAt = 0;
    nextImpactAt = 0;
    side2AudioVisualPulse = 0;
    side2AudioVisualPulseAt = -Infinity;
    stableMaskCtx.clearRect(0, 0, stableMaskCanvas.width, stableMaskCanvas.height);
    stableMaskBufferCtx.clearRect(0, 0, stableMaskBufferCanvas.width, stableMaskBufferCanvas.height);
    lensMaskCtx.clearRect(0, 0, lensMaskCanvas.width, lensMaskCanvas.height);
  }

  function renderFrame(now) {
    const dt = lastVisualFrameAt
      ? clamp((now - lastVisualFrameAt) / 1000, 0.001, 0.08)
      : 0.016;
    lastVisualFrameAt = now;

    currentCtx.globalAlpha = 1;
    currentCtx.globalCompositeOperation = "source-over";
    currentCtx.filter = "none";
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = "source-over";
    ctx.filter = "none";

    drawSourceCover(currentCtx, video, currentCanvas.width, currentCanvas.height);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(currentCanvas, 0, 0);

    latestProgress = bodyIsPresent
      ? (manualStage ? getManualStageProgress(manualStage) : getTransformationProgress(now))
      : (manualStage ? getManualStageProgress(manualStage) : Math.max(SIDE2_FIELD_IDLE_PROGRESS, latestProgress * 0.985));

    prepareLensMask(latestProgress);
    updateOpticalLenses(latestProgress, now, dt);
    drawOpticalLensSystem(latestProgress, now);

    if (!bodyIsPresent) {
      resetLensBubbles();
      resetOutwardEmissionFragments();
      setAudioTargets(0, 0, 0, now);
      updateAudio(now, 0);
      return;
    }

    updateAudioFromPose(now, latestProgress);
  }

  function prepareLensMask(progress) {
    const haloBlur = lerp(10, SIDE2_LENS_MASK_BLUR, progress);

    lensMaskCtx.clearRect(0, 0, lensMaskCanvas.width, lensMaskCanvas.height);
    lensMaskCtx.save();
    lensMaskCtx.filter = "blur(" + haloBlur + "px)";
    lensMaskCtx.drawImage(stableMaskCanvas, 0, 0);
    lensMaskCtx.globalAlpha = 0.72;
    lensMaskCtx.filter = "blur(3px)";
    lensMaskCtx.drawImage(stableMaskCanvas, 0, 0);
    lensMaskCtx.globalAlpha = 1;
    lensMaskCtx.filter = "none";
    lensMaskCtx.restore();
  }

  function updateOpticalLenses(progress, now, dt) {
    const targetCount = getSide2LensCount(progress);
    const bounds = getFieldEffectBounds();
    const bodyBounds = getBodyEffectBounds();
    const focusBounds = updateFieldBodyFocusState(bodyBounds, dt);
    const skeletonNetwork = updateSkeletonTransportNetwork(bodyBounds);
    const bodyScale = bodyBounds ? Math.max(90, Math.max(bodyBounds.width, bodyBounds.height)) : Math.max(90, Math.min(canvas.width, canvas.height));
    const sceneScale = Math.max(90, Math.min(canvas.width || 1, canvas.height || 1));
    const stagePower = smoothstep(0.02, 1, progress);
    const audioPulse = getAudioVisualPulse(now) * stagePower;
    updateLensGlitchState(progress, now);

    if (side2Lenses.length > SIDE2_LENS_MAX_COUNT) {
      side2Lenses.length = SIDE2_LENS_MAX_COUNT;
    }

    const createBatchSize = getSide2LensCreateBatchSize();
    const prewarmCount = Math.min(SIDE2_LENS_MAX_COUNT, targetCount + createBatchSize);
    const desiredPoolCount = prewarmCount > side2Lenses.length
      ? Math.min(prewarmCount, side2Lenses.length + createBatchSize)
      : side2Lenses.length;

    while (side2Lenses.length < desiredPoolCount) {
      side2Lenses.push(createOpticalLens(side2Lenses.length));
    }

    for (let index = 0; index < side2Lenses.length; index += 1) {
      const lens = side2Lenses[index];
      const active = index < targetCount;
      if (!active && lens.presence <= 0.002) continue;

      if (!lens.fieldReady) initializeFieldLens(lens, now);

      const paramBlend = 1 - Math.exp(-dt / lens.paramSmoothing);
      const pulse = Math.sin(now * lens.pulseRate + lens.phase);
      const collectivePulse = getCollectiveFieldPulse(lens, now, progress);
      const glitch = getLensGlitchInfluence(lens, lens, now);
      const freeze = side2LensGlitchState.active && side2LensGlitchState.kind === "freeze" ? glitch * 0.92 : 0;
      const fieldState = updateFieldLensMotion(lens, bounds, bodyBounds, focusBounds, skeletonNetwork, bodyScale, sceneScale, progress, now, dt, freeze);
      const focusState = fieldState.focus;
      const organicPulse = pulse + Math.sin(now * lens.secondaryPulseRate + lens.phase * 2.4) * 0.16;
      const audioPulseWeight = lerp(0.58, 1.14, hash1(index, 1229));
      const radiusTarget = sceneScale * lens.baseRadius * focusState.radiusScale * lerp(0.78, 1.18, stagePower) * (1 + organicPulse * lens.radiusPulse + collectivePulse * lens.collectivePulseAmount + audioPulse * audioPulseWeight * 0.035 + glitch * lens.glitchScaleAmount * 0.55);
      const strengthTarget = lens.baseStrength * focusState.strengthScale * lerp(0.36, 1.18, stagePower) * (1 + collectivePulse * 0.22 + Math.cos(now * lens.strengthRate + lens.phase) * 0.24) * (1 + fieldState.boundary * 0.36 + audioPulse * audioPulseWeight * 0.075 + glitch * 0.28);
      const presenceTarget = active ? getFieldLensPresenceTarget(lens, now, progress, bodyIsPresent, focusState) : 0;

      updateFieldTextureExchange(lens, bodyBounds, progress, now, dt);

      lens.presence = lerp(lens.presence, presenceTarget, 1 - Math.exp(-dt / (active ? 0.34 : 0.72)));
      lens.fieldAlphaScale = lerp(lens.fieldAlphaScale || focusState.alphaScale, focusState.alphaScale, paramBlend);
      lens.radius = lerp(lens.radius, radiusTarget, paramBlend);
      lens.aspect = lerp(lens.aspect, lens.baseAspect * (1 + Math.sin(now * lens.aspectRate + lens.phase) * lens.aspectPulse + Math.sin(now * lens.morphRate + lens.phase * 2.6) * lens.morphAspect + fieldState.compression * 0.2) * (1 + glitch * lens.glitchAspectAmount * 0.82), paramBlend);
      lens.orientation = lerpAngle(lens.orientation, fieldState.angle + lens.orientationOffset + Math.sin(now * lens.rotationRate + lens.phase) * lens.rotationWobble + glitch * lens.glitchRotation, paramBlend);
      lens.strength = lerp(lens.strength, strengthTarget, paramBlend);
      lens.twist = lerp(lens.twist, lens.baseTwist * (0.75 + Math.sin(now * lens.twistRate + lens.phase) * 0.25 + fieldState.curl * 0.38), paramBlend);
      lens.blur = lerp(lens.blur, lens.baseBlur || 0, paramBlend);
      lens.morphAmount = lerp(lens.morphAmount, lens.baseMorphAmount * lerp(0.28, 1.18, stagePower) * (1 + glitch * 1.45), paramBlend);
      lens.morphPhase = now * lens.morphRate + lens.phase * 1.9 + Math.sin(now * lens.aspectRate + lens.phase) * 0.8;
      lens.pixelEdgeAmount = lerp(lens.pixelEdgeAmount, lens.pixelated ? lerp(0.34, 1, stagePower) * (1 + glitch * 1.8) : glitch * 0.42, paramBlend);
      lens.glitchAmount = lerp(lens.glitchAmount, glitch, 1 - Math.exp(-dt / (glitch > lens.glitchAmount ? 0.035 : 0.26)));
      lens.glitchSampleShiftX = Math.sin(side2LensGlitchState.seed * 1.3 + lens.phase) * bodyScale * 0.105 * lens.glitchAmount;
      lens.glitchSampleShiftY = Math.cos(side2LensGlitchState.seed * 0.9 + lens.phase * 1.4) * bodyScale * 0.075 * lens.glitchAmount;
    }

    updateLensOrganismInteractions(progress, now);
  }

  function initializeFieldLens(lens, now) {
    const position = getInitialFieldLensPosition(lens.index);
    lens.x = position.x;
    lens.y = position.y;
    lens.previousX = position.x;
    lens.previousY = position.y;
    lens.vx = Math.cos(lens.phase) * Math.max(1, Math.min(canvas.width || 1, canvas.height || 1)) * 0.012;
    lens.vy = Math.sin(lens.phase * 1.37) * Math.max(1, Math.min(canvas.width || 1, canvas.height || 1)) * 0.012;
    lens.misX = position.x;
    lens.misY = position.y;
    lens.misTargetX = position.x;
    lens.misTargetY = position.y;
    lens.maskBlend = 0;
    lens.sourceBlend = 0;
    lens.stagnation = 0;
    lens.fieldReady = true;
    lens.fieldBornAt = now;
  }

  function getInitialFieldLensPosition(index) {
    const width = Math.max(1, canvas.width || 1);
    const height = Math.max(1, canvas.height || 1);
    const u = (index * 0.61803398875 + hash1(index, 1741) * 0.17) % 1;
    const v = (index * 0.75487766625 + hash1(index, 1747) * 0.19) % 1;
    const edgeBias = hash1(index, 1753);
    const halo = edgeBias > 0.74 ? lerp(-0.08, 1.08, hash1(index, 1759)) : u;

    return {
      x: clamp(halo * width, -SIDE2_FIELD_EDGE_MARGIN, width + SIDE2_FIELD_EDGE_MARGIN),
      y: clamp(v * height, -SIDE2_FIELD_EDGE_MARGIN, height + SIDE2_FIELD_EDGE_MARGIN)
    };
  }

  function updateFieldBodyFocusState(bodyBounds, dt) {
    if (!bodyIsPresent || !bodyBounds) {
      const release = 1 - Math.exp(-dt / SIDE2_FIELD_WAKE_TRAIL_SECONDS);
      if (side2FieldFocusBounds) {
        side2FieldFocusBounds.x = lerp(side2FieldFocusBounds.x, 0, release * 0.1);
        side2FieldFocusBounds.y = lerp(side2FieldFocusBounds.y, 0, release * 0.1);
        side2FieldFocusBounds.width = lerp(side2FieldFocusBounds.width, canvas.width || side2FieldFocusBounds.width, release * 0.08);
        side2FieldFocusBounds.height = lerp(side2FieldFocusBounds.height, canvas.height || side2FieldFocusBounds.height, release * 0.08);
      }
      side2FieldWake.x = lerp(side2FieldWake.x, 0, release);
      side2FieldWake.y = lerp(side2FieldWake.y, 0, release);
      return null;
    }

    if (!side2FieldFocusBounds) {
      side2FieldFocusBounds = { ...bodyBounds };
      side2FieldWake.x = 0;
      side2FieldWake.y = 0;
      return side2FieldFocusBounds;
    }

    const previousCenterX = side2FieldFocusBounds.x + side2FieldFocusBounds.width * 0.5;
    const previousCenterY = side2FieldFocusBounds.y + side2FieldFocusBounds.height * 0.52;
    const targetCenterX = bodyBounds.x + bodyBounds.width * 0.5;
    const targetCenterY = bodyBounds.y + bodyBounds.height * 0.52;
    const blend = 1 - Math.exp(-dt / SIDE2_FIELD_BODY_FOCUS_SMOOTH_SECONDS);
    const wakeBlend = 1 - Math.exp(-dt / SIDE2_FIELD_WAKE_TRAIL_SECONDS);

    side2FieldFocusBounds.x = lerp(side2FieldFocusBounds.x, bodyBounds.x, blend);
    side2FieldFocusBounds.y = lerp(side2FieldFocusBounds.y, bodyBounds.y, blend);
    side2FieldFocusBounds.width = lerp(side2FieldFocusBounds.width, bodyBounds.width, blend * 0.72);
    side2FieldFocusBounds.height = lerp(side2FieldFocusBounds.height, bodyBounds.height, blend * 0.72);

    side2FieldWake.x = lerp(side2FieldWake.x, previousCenterX - targetCenterX, wakeBlend);
    side2FieldWake.y = lerp(side2FieldWake.y, previousCenterY - targetCenterY, wakeBlend);

    return side2FieldFocusBounds;
  }

  function updateFieldLensMotion(lens, bounds, bodyBounds, focusBounds, skeletonNetwork, bodyScale, sceneScale, progress, now, dt, freeze) {
    const step = clamp(dt, 0.001, 0.08);
    const stagePower = smoothstep(0.02, 1, progress);
    const flow = getGlobalMembraneFlow(lens.x, lens.y, now, lens, progress);
    const disturbance = getBodyFieldDisturbance(lens, bodyBounds, focusBounds, bodyScale, sceneScale, progress, now);
    const skeletonFlow = getSkeletonTransportState(lens, skeletonNetwork, bodyScale, progress, now);
    const focusState = disturbance.focus;
    if (skeletonFlow.density > 0.001) {
      focusState.alphaScale *= 1 + skeletonFlow.density * 0.28;
      focusState.radiusScale *= 1 + skeletonFlow.density * 0.12;
      focusState.strengthScale *= 1 + skeletonFlow.density * 0.2;
      focusState.presenceScale = Math.max(focusState.presenceScale, 0.22 + skeletonFlow.density * 1.18);
      focusState.wake = Math.max(focusState.wake, skeletonFlow.density * 0.86);
    }
    const jitter = getSmallScaleFieldVariation(lens, now, sceneScale);
    const speedScale = sceneScale * lerp(SIDE2_FIELD_BASE_SPEED, SIDE2_FIELD_BASE_SPEED * 1.85, stagePower);
    const externalFlowScale = skeletonNetwork ? lerp(0.18, 0.68, 1 - skeletonFlow.attachment) : 1;
    const stagnationBoost = smoothstep(SIDE2_FIELD_STAGNATION_SECONDS * 0.38, SIDE2_FIELD_STAGNATION_SECONDS, lens.stagnation || 0);
    const wakeX = side2FieldWake.x * disturbance.focus.wake * SIDE2_FIELD_WAKE_DRAG * stagePower * (1 - skeletonFlow.attachment * 0.82);
    const wakeY = side2FieldWake.y * disturbance.focus.wake * SIDE2_FIELD_WAKE_DRAG * stagePower * (1 - skeletonFlow.attachment * 0.82);
    const focusPullX = disturbance.focus.pullX * bodyScale * SIDE2_FIELD_FOCUS_PULL * stagePower * (1 - skeletonFlow.attachment * 0.54);
    const focusPullY = disturbance.focus.pullY * bodyScale * SIDE2_FIELD_FOCUS_PULL * stagePower * (1 - skeletonFlow.attachment * 0.54);
    const bodyPullX = disturbance.focus.bodyPullX * bodyScale * SIDE2_FIELD_DIRECT_BODY_PULL * stagePower * (1 - skeletonFlow.attachment * 0.4);
    const bodyPullY = disturbance.focus.bodyPullY * bodyScale * SIDE2_FIELD_DIRECT_BODY_PULL * stagePower * (1 - skeletonFlow.attachment * 0.4);
    const skeletonPullX = skeletonFlow.pullX * bodyScale * SIDE2_SKELETON_TRANSPORT_PULL * stagePower;
    const skeletonPullY = skeletonFlow.pullY * bodyScale * SIDE2_SKELETON_TRANSPORT_PULL * stagePower;
    const skeletonRouteX = skeletonFlow.tangentX * bodyScale * SIDE2_SKELETON_TRANSPORT_FLOW * skeletonFlow.attachment * stagePower;
    const skeletonRouteY = skeletonFlow.tangentY * bodyScale * SIDE2_SKELETON_TRANSPORT_FLOW * skeletonFlow.attachment * stagePower;

    lens.vx += ((flow.x * speedScale + jitter.x) * externalFlowScale + disturbance.x + focusPullX + bodyPullX + skeletonPullX + skeletonRouteX + wakeX) * step;
    lens.vy += ((flow.y * speedScale + jitter.y) * externalFlowScale + disturbance.y + focusPullY + bodyPullY + skeletonPullY + skeletonRouteY + wakeY) * step;

    if (stagnationBoost > 0.01) {
      const escapeAngle = lens.phase + now * lerp(0.00011, 0.00024, hash1(lens.index, 1761));
      lens.vx += Math.cos(escapeAngle) * sceneScale * 0.055 * stagnationBoost * step;
      lens.vy += Math.sin(escapeAngle) * sceneScale * 0.055 * stagnationBoost * step;
    }

    const drag = Math.exp(-step * lerp(0.54, 1.18, hash1(lens.index, 1763)));
    lens.vx *= drag;
    lens.vy *= drag;

    const maxSpeed = sceneScale * SIDE2_FIELD_MAX_SPEED * lerp(0.82, 1.26, stagePower);
    const speed = Math.hypot(lens.vx, lens.vy);
    if (speed > maxSpeed) {
      lens.vx = lens.vx / speed * maxSpeed;
      lens.vy = lens.vy / speed * maxSpeed;
    }

    const previousX = lens.x;
    const previousY = lens.y;
    const motionGate = 1 - freeze;
    lens.x += lens.vx * step * motionGate;
    lens.y += lens.vy * step * motionGate;
    if (skeletonFlow.attachment > 0.02) {
      const followSeconds = lerp(SIDE2_SKELETON_DETACHED_FOLLOW_SECONDS, SIDE2_SKELETON_SURFACE_FOLLOW_SECONDS, skeletonFlow.attachment);
      const surfaceBlend = (1 - Math.exp(-step / followSeconds)) * skeletonFlow.attachment * motionGate;
      lens.x = lerp(lens.x, skeletonFlow.targetX, surfaceBlend);
      lens.y = lerp(lens.y, skeletonFlow.targetY, surfaceBlend);
      lens.vx = lerp(lens.vx, skeletonFlow.tangentX * bodyScale * SIDE2_SKELETON_TRANSPORT_FLOW, surfaceBlend * 0.34);
      lens.vy = lerp(lens.vy, skeletonFlow.tangentY * bodyScale * SIDE2_SKELETON_TRANSPORT_FLOW, surfaceBlend * 0.34);
    }
    wrapFieldLensPosition(lens, bounds);

    const moved = Math.hypot(lens.x - previousX, lens.y - previousY);
    lens.stagnation = moved < sceneScale * 0.002 ? (lens.stagnation || 0) + step : Math.max(0, (lens.stagnation || 0) - step * 0.9);
    lens.previousX = previousX;
    lens.previousY = previousY;

    return {
      angle: Math.atan2(lens.vy + skeletonFlow.tangentY * skeletonFlow.density, lens.vx + skeletonFlow.tangentX * skeletonFlow.density),
      boundary: disturbance.boundary,
      compression: disturbance.compression + skeletonFlow.density * 0.18,
      curl: flow.curl + skeletonFlow.curve * 0.42,
      focus: focusState
    };
  }

  function getGlobalMembraneFlow(x, y, now, lens, progress) {
    const width = Math.max(1, canvas.width || 1);
    const height = Math.max(1, canvas.height || 1);
    const nx = x / width;
    const ny = y / height;
    const phase = lens.phase || 0;
    const slow = now * 0.000036;
    const sweepAngle = slow + Math.sin(now * 0.000021) * 0.9 + progress * 0.4;
    let vx = Math.cos(sweepAngle) * 0.72 + Math.sin(ny * Math.PI * 2.3 + slow * 4.7 + phase) * 0.22;
    let vy = Math.sin(sweepAngle) * 0.46 + Math.cos(nx * Math.PI * 1.9 - slow * 3.8 + phase * 0.7) * 0.2;
    let curl = 0;

    for (let i = 0; i < 3; i += 1) {
      const seed = lens.index * 0.013 + i * 2.71;
      const cx = 0.5 + Math.sin(slow * (1.3 + i * 0.22) + i * 2.1) * (0.28 + i * 0.025);
      const cy = 0.5 + Math.cos(slow * (1.1 + i * 0.18) + i * 1.8) * (0.24 + i * 0.02);
      const dx = nx - cx;
      const dy = ny - cy;
      const d2 = dx * dx + dy * dy;
      const radius = 0.18 + i * 0.08;
      const influence = Math.exp(-d2 / Math.max(0.001, radius * radius));
      const spin = i % 2 ? -1 : 1;
      vx += -dy * influence * spin * (0.54 + Math.sin(seed + slow * 5) * 0.16);
      vy += dx * influence * spin * (0.44 + Math.cos(seed + slow * 4.2) * 0.14);
      curl += influence * spin;
    }

    const length = Math.max(0.001, Math.hypot(vx, vy));
    return {
      x: vx / length,
      y: vy / length,
      curl: clamp(curl, -1, 1)
    };
  }

  function getSmallScaleFieldVariation(lens, now, sceneScale) {
    const a = now * lens.driftRate + lens.phase;
    const b = now * lens.orbitRate + lens.phase * 2.3;
    return {
      x: (Math.sin(a) * 0.55 + Math.cos(b * 0.67) * 0.32) * sceneScale * 0.012,
      y: (Math.cos(a * 0.82) * 0.45 + Math.sin(b) * 0.28) * sceneScale * 0.012
    };
  }

  function updateSkeletonTransportNetwork(bodyBounds) {
    if (!bodyIsPresent || !bodyBounds || !latestPosePoints) return null;

    const nose = getPosePoint(POSE_LANDMARKS.nose);
    const leftShoulder = getPosePoint(POSE_LANDMARKS.leftShoulder);
    const rightShoulder = getPosePoint(POSE_LANDMARKS.rightShoulder);
    const leftElbow = getPosePoint(POSE_LANDMARKS.leftElbow);
    const rightElbow = getPosePoint(POSE_LANDMARKS.rightElbow);
    const leftWrist = getPosePoint(POSE_LANDMARKS.leftWrist);
    const rightWrist = getPosePoint(POSE_LANDMARKS.rightWrist);
    const leftHip = getPosePoint(POSE_LANDMARKS.leftHip);
    const rightHip = getPosePoint(POSE_LANDMARKS.rightHip);
    const leftKnee = getPosePoint(POSE_LANDMARKS.leftKnee);
    const rightKnee = getPosePoint(POSE_LANDMARKS.rightKnee);
    const leftAnkle = getPosePoint(POSE_LANDMARKS.leftAnkle);
    const rightAnkle = getPosePoint(POSE_LANDMARKS.rightAnkle);
    const shoulderMid = averagePoints(leftShoulder, rightShoulder) || {
      x: bodyBounds.x + bodyBounds.width * 0.5,
      y: bodyBounds.y + bodyBounds.height * 0.32
    };
    const hipMid = averagePoints(leftHip, rightHip) || {
      x: bodyBounds.x + bodyBounds.width * 0.5,
      y: bodyBounds.y + bodyBounds.height * 0.68
    };
    const neck = nose
      ? {
        x: lerp(nose.x, shoulderMid.x, 0.62),
        y: lerp(nose.y, shoulderMid.y, 0.62)
      }
      : {
        x: shoulderMid.x,
        y: shoulderMid.y - bodyBounds.height * 0.08
      };
    const spineMid = {
      x: lerp(shoulderMid.x, hipMid.x, 0.5),
      y: lerp(shoulderMid.y, hipMid.y, 0.5)
    };
    const routes = [
      compactRoute([nose || neck, neck, shoulderMid, spineMid, hipMid]),
      compactRoute([neck, leftShoulder, leftElbow, leftWrist, leftElbow, leftShoulder, shoulderMid, spineMid]),
      compactRoute([neck, rightShoulder, rightElbow, rightWrist, rightElbow, rightShoulder, shoulderMid, spineMid]),
      compactRoute([shoulderMid, leftShoulder, leftHip, hipMid, rightHip, rightShoulder, shoulderMid]),
      compactRoute([hipMid, leftHip, leftKnee, leftAnkle, leftKnee, leftHip, hipMid]),
      compactRoute([hipMid, rightHip, rightKnee, rightAnkle, rightKnee, rightHip, hipMid]),
      compactRoute([leftWrist, leftElbow, leftShoulder, neck, rightShoulder, rightElbow, rightWrist]),
      compactRoute([leftAnkle, leftKnee, leftHip, hipMid, rightHip, rightKnee, rightAnkle])
    ].filter((route) => route.length > 1);

    return routes.length ? { routes, bodyBounds, neck, shoulderMid, hipMid } : null;
  }

  function compactRoute(points) {
    const route = [];

    for (let index = 0; index < points.length; index += 1) {
      const point = points[index];
      if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
        route.push(point);
      }
    }

    return route;
  }

  function averagePoints(first, second) {
    if (first && second) return { x: (first.x + second.x) * 0.5, y: (first.y + second.y) * 0.5 };
    return first || second || null;
  }

  function getSkeletonTransportState(lens, skeletonNetwork, bodyScale, progress, now) {
    if (!skeletonNetwork || !skeletonNetwork.routes.length) {
      return getEmptySkeletonTransportState();
    }

    const stagePower = smoothstep(0.08, 1, progress);
    const routeCount = skeletonNetwork.routes.length;
    const routeTurn = Math.floor(now * lens.skeletonRouteSwitchRate + lens.skeletonRouteSeed * routeCount);
    const routeIndex = Math.abs(routeTurn + Math.floor(lens.skeletonRouteFamily * routeCount)) % routeCount;
    const route = skeletonNetwork.routes[routeIndex];
    if (!route || route.length < 2) return getEmptySkeletonTransportState();

    const direction = lens.skeletonDirection || 1;
    const pathT = (lens.skeletonRoutePhase + now * lens.skeletonRouteRate * direction) % 1;
    const sample = sampleSkeletonRoute(route, pathT < 0 ? pathT + 1 : pathT);
    if (!sample) return getEmptySkeletonTransportState();

    const tangentX = sample.tangentX;
    const tangentY = sample.tangentY;
    const normalX = -tangentY;
    const normalY = tangentX;
    const width = Math.max(10, bodyScale * SIDE2_SKELETON_TRANSPORT_WIDTH * lens.skeletonPathWidth);
    const orbit = Math.sin(now * lens.skeletonOrbitRate + lens.phase) * width * 0.48;
    const ripple = Math.sin(now * lens.skeletonPulseRate + lens.phase * 1.7) * width * 0.22;
    const targetX = sample.x + normalX * orbit + tangentX * ripple;
    const targetY = sample.y + normalY * orbit + tangentY * ripple;
    const dx = targetX - lens.x;
    const dy = targetY - lens.y;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    const pathDensity = (1 - smoothstep(width * 0.44, width * 3.6, distance)) * stagePower;
    const detachWave = 0.5 + Math.sin(now * lens.skeletonDetachRate + lens.phase * 2.1) * 0.5;
    const detached = smoothstep(0.82, 0.985, detachWave) * lens.skeletonDetachAmount;
    const routeCommitment = lerp(0.62, 1.0, lens.skeletonAttraction);
    const reconnect = smoothstep(width * 5.5, width * 1.4, distance);
    const attachment = clamp((routeCommitment * 0.68 + reconnect * 0.32 + pathDensity * 0.26) * (1 - detached * 0.64), 0, 1);
    const pull = attachment * (0.64 + lens.skeletonAttraction * 0.72);
    const curve = Math.sin(now * lens.skeletonPulseRate * 0.42 + lens.phase) * pathDensity;

    return {
      pullX: (dx / distance) * pull,
      pullY: (dy / distance) * pull,
      tangentX: tangentX * lens.skeletonDirection,
      tangentY: tangentY * lens.skeletonDirection,
      targetX,
      targetY,
      density: Math.max(pathDensity, attachment * 0.72) * (1 - detached * 0.5) * SIDE2_SKELETON_TRANSPORT_DENSITY,
      attachment,
      curve
    };
  }

  function getEmptySkeletonTransportState() {
    return {
      pullX: 0,
      pullY: 0,
      tangentX: 0,
      tangentY: 0,
      targetX: 0,
      targetY: 0,
      density: 0,
      attachment: 0,
      curve: 0
    };
  }

  function sampleSkeletonRoute(route, t) {
    const scaled = clamp(t, 0, 0.9999) * (route.length - 1);
    const index = Math.min(route.length - 2, Math.floor(scaled));
    const localT = scaled - index;
    const from = route[index];
    const to = route[index + 1];
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const length = Math.max(0.001, Math.hypot(dx, dy));

    return {
      x: lerp(from.x, to.x, localT),
      y: lerp(from.y, to.y, localT),
      tangentX: dx / length,
      tangentY: dy / length
    };
  }

  function getBodyFieldDisturbance(lens, bodyBounds, focusBounds, bodyScale, sceneScale, progress, now) {
    if (!bodyIsPresent || !bodyBounds) {
      return {
        x: 0,
        y: 0,
        influence: 0,
        boundary: 0,
        compression: 0,
        focus: getAmbientFieldFocusState(lens, now, progress)
      };
    }

    const motionBounds = bodyBounds;
    const centerX = motionBounds.x + motionBounds.width * 0.5;
    const centerY = motionBounds.y + motionBounds.height * 0.52;
    const radiusX = Math.max(32, motionBounds.width * 0.55);
    const radiusY = Math.max(48, motionBounds.height * 0.55);
    let nx = (lens.x - centerX) / radiusX;
    let ny = (lens.y - centerY) / radiusY;
    const distance = Math.max(0.001, Math.hypot(nx, ny));
    nx /= distance;
    ny /= distance;

    const mask = getCanvasMaskValue(lens.x, lens.y);
    const inside = smoothstep(0.18, 0.7, mask);
    const ellipseBoundary = 1 - smoothstep(0.78, 1.42, Math.abs(distance - 1) + 0.18);
    const maskBoundary = 1 - Math.abs(inside * 2 - 1);
    const boundary = clamp(Math.max(maskBoundary, ellipseBoundary * 0.72), 0, 1);
    const stagePower = smoothstep(0.04, 1, progress);
    const tangentSign = hash1(lens.index, 1771) > 0.5 ? 1 : -1;
    const tangentX = -ny * tangentSign;
    const tangentY = nx * tangentSign;
    const membrane = boundary * stagePower;
    const crossingWave = Math.sin(lens.phase + progress * 4.8 + latestPoseMotion * 0.025) * 0.5 + 0.5;
    const permeability = lerp(-0.42, 0.42, crossingWave) * membrane;
    const compression = membrane * (0.45 + latestPoseMotion * 0.012);
    const focus = getBodyFieldFocusState(lens, bodyBounds, motionBounds, bodyScale, sceneScale, progress, now, inside, distance, nx, ny);

    return {
      x: (tangentX * SIDE2_FIELD_BOUNDARY_TANGENT + nx * permeability * 0.035) * bodyScale,
      y: (tangentY * SIDE2_FIELD_BOUNDARY_TANGENT + ny * permeability * 0.035) * bodyScale,
      influence: clamp((1 - smoothstep(1.55, 2.35, distance)) * stagePower, 0, 1),
      boundary,
      compression,
      focus
    };
  }

  function getAmbientFieldFocusState(lens, now, progress) {
    const stagePower = smoothstep(0.02, 1, progress);
    const frameFade = getSceneEdgeDensityFade(lens.x, lens.y);
    const life = 0.82 + Math.sin(now * lens.lifeRate + lens.phase) * 0.12;
    const focus = clamp(lerp(0.3, 0.48, stagePower) * frameFade * life, 0.16, 0.58);

    return {
      focus,
      alphaScale: lerp(0.32, 0.58, focus),
      radiusScale: lerp(0.52, 0.74, focus),
      strengthScale: lerp(0.46, 0.72, focus),
      presenceScale: lerp(0.44, 0.66, focus),
      pullX: 0,
      pullY: 0,
      bodyPullX: 0,
      bodyPullY: 0,
      wake: 0
    };
  }

  function getBodyFieldFocusState(lens, bodyBounds, focusBounds, bodyScale, sceneScale, progress, now, inside, distance, nx, ny) {
    const stagePower = smoothstep(0.02, 1, progress);
    const frameFade = getSceneEdgeDensityFade(lens.x, lens.y);
    const currentCenterX = bodyBounds.x + bodyBounds.width * 0.5;
    const currentCenterY = bodyBounds.y + bodyBounds.height * 0.52;
    const currentRadiusX = Math.max(32, bodyBounds.width * 0.52);
    const currentRadiusY = Math.max(48, bodyBounds.height * 0.54);
    const currentDistance = Math.hypot((lens.x - currentCenterX) / currentRadiusX, (lens.y - currentCenterY) / currentRadiusY);
    const nearBody = 1 - smoothstep(SIDE2_FIELD_FOCUS_INNER_DISTANCE, SIDE2_FIELD_FOCUS_OUTER_DISTANCE, distance);
    const immediateBody = Math.max(inside, 1 - smoothstep(0.58, 1.16, currentDistance));
    const silhouetteBand = 1 - smoothstep(0.84, 1.46, Math.abs(currentDistance - 1) + (1 - inside) * 0.08);
    const upperBody = lens.y < bodyBounds.y + bodyBounds.height * 0.56 ? 1 - smoothstep(0.62, 1.34, currentDistance) : 0;
    const surroundingSpace = 1 - smoothstep(1.12, 2.65, distance);
    const head = getHeadFocusPoint(bodyBounds);
    const headDx = lens.x - head.x;
    const headDy = lens.y - head.y;
    const headRadiusX = Math.max(36, bodyBounds.width * 0.28);
    const headRadiusY = Math.max(42, bodyBounds.height * 0.18);
    const headDistance = Math.hypot(headDx / headRadiusX, headDy / headRadiusY);
    const headCoverage = 1 - smoothstep(0.55, 2.15, headDistance);
    const organicVariation = 0.88
      + Math.sin(now * lens.lifeRate * 0.74 + lens.phase * 1.7) * 0.1
      + Math.sin(now * lens.driftRate * 0.41 + lens.phase * 0.6) * 0.06;
    const densityBias = lens.fieldDensityBias || 1;
    const bodyFocus = clamp(
      (
        immediateBody * 1.38
        + silhouetteBand * 0.74
        + upperBody * 0.36
        + nearBody * 0.34
        + surroundingSpace * 0.1
        + headCoverage * SIDE2_FIELD_FACE_COVERAGE_BOOST
      )
        * frameFade
        * organicVariation
        * densityBias,
      0.04,
      1.68
    );
    const normalizedFocus = smoothstep(0.08, 1.18, bodyFocus);
    const focusTarget = getFieldFocusTarget(lens, bodyBounds, focusBounds, head, progress, now);
    const targetDx = focusTarget.x - lens.x;
    const targetDy = focusTarget.y - lens.y;
    const targetDistance = Math.max(0.001, Math.hypot(targetDx, targetDy));
    const outsidePull = (1 - inside) * smoothstep(0.62, 2.25, currentDistance) * (1 - smoothstep(2.3, 3.35, currentDistance));
    const insideTransit = inside * smoothstep(0.16, 0.92, currentDistance);
    const headPull = headCoverage * (lens.fieldFaceCoverBias || 0) * (0.45 + (1 - inside) * 0.75);
    const membranePull = smoothstep(0.82, 1.7, currentDistance) * (1 - smoothstep(1.85, 2.75, currentDistance)) * 0.62;
    const pull = clamp((outsidePull * 1.05 + insideTransit * 0.38 + headPull * 0.52 + membranePull) * stagePower, 0, 1.45);
    const tangentBias = Math.sin(now * lens.orbitRate + lens.phase) * 0.5 + 0.5;
    const tangentX = -ny * lerp(-0.22, 0.22, tangentBias);
    const tangentY = nx * lerp(-0.22, 0.22, tangentBias);

    return {
      focus: bodyFocus,
      alphaScale: lerp(0.1, 1.38 + headCoverage * 0.22, normalizedFocus),
      radiusScale: lerp(0.34, 1.38 + headCoverage * 0.26 + immediateBody * 0.12, normalizedFocus),
      strengthScale: lerp(0.34, 1.34 + headCoverage * 0.28 + inside * 0.1, normalizedFocus),
      presenceScale: lerp(0.12, 1.32 + inside * 0.12, normalizedFocus),
      pullX: (targetDx / targetDistance) * pull + tangentX * nearBody * stagePower,
      pullY: (targetDy / targetDistance) * pull + tangentY * nearBody * stagePower,
      bodyPullX: ((currentCenterX - lens.x) / Math.max(1, bodyScale)) * (0.38 + inside * 0.12 + headCoverage * 0.28),
      bodyPullY: ((currentCenterY - lens.y) / Math.max(1, bodyScale)) * (0.38 + inside * 0.12 + headCoverage * 0.28),
      wake: clamp(0.18 + nearBody * 0.48 + immediateBody * 0.42 + headCoverage * 0.18, 0, 1.1)
    };
  }

  function getFieldFocusTarget(lens, bodyBounds, focusBounds, head, progress, now) {
    const targetBounds = focusBounds || bodyBounds;
    const bodyCenterX = targetBounds.x + targetBounds.width * 0.5;
    const bodyCenterY = targetBounds.y + targetBounds.height * 0.53;
    const role = (lens.fieldFocusRole || 0) + Math.sin(now * 0.000021 + lens.phase) * 0.08;
    const wave = now * lerp(0.000035, 0.000095, hash1(lens.index, 1811)) + lens.phase;
    let x = bodyCenterX;
    let y = bodyCenterY;

    if (role > 0.78) {
      x = head.x + Math.cos(wave) * targetBounds.width * 0.2;
      y = head.y + Math.sin(wave * 0.72) * targetBounds.height * 0.1;
    } else if (role > 0.48) {
      x = bodyCenterX + Math.sin(wave * 0.82) * targetBounds.width * 0.28;
      y = targetBounds.y + targetBounds.height * lerp(0.24, 0.68, hash1(lens.index, 1813));
    } else if (role > 0.22) {
      x = bodyCenterX + Math.sin(wave * 0.68) * targetBounds.width * 0.22;
      y = targetBounds.y + targetBounds.height * lerp(0.16, 0.5, hash1(lens.index, 1815));
    } else {
      x = bodyCenterX + Math.cos(wave * 0.58) * targetBounds.width * 0.16;
      y = bodyCenterY + Math.sin(wave * 0.76) * targetBounds.height * 0.2;
    }

    return {
      x: clamp(x, bodyBounds.x - bodyBounds.width * 0.12, bodyBounds.x + bodyBounds.width * 1.12),
      y: clamp(y, bodyBounds.y - bodyBounds.height * 0.08, bodyBounds.y + bodyBounds.height * 1.08)
    };
  }

  function getHeadFocusPoint(bodyBounds) {
    const nose = getPosePoint(POSE_LANDMARKS.nose);
    const leftEye = getPosePoint(POSE_LANDMARKS.leftEye);
    const rightEye = getPosePoint(POSE_LANDMARKS.rightEye);

    if (nose && leftEye && rightEye) {
      return {
        x: (nose.x + leftEye.x + rightEye.x) / 3,
        y: (nose.y + leftEye.y + rightEye.y) / 3
      };
    }

    if (nose) {
      return { x: nose.x, y: nose.y };
    }

    return {
      x: bodyBounds.x + bodyBounds.width * 0.5,
      y: bodyBounds.y + bodyBounds.height * 0.18
    };
  }

  function getSceneEdgeDensityFade(x, y) {
    const width = Math.max(1, canvas.width || 1);
    const height = Math.max(1, canvas.height || 1);
    const margin = Math.max(24, Math.min(width, height) * SIDE2_FIELD_EDGE_DENSITY_MARGIN);
    const fade = Math.min(
      smoothstep(0, margin, x),
      smoothstep(0, margin, y),
      smoothstep(0, margin, width - x),
      smoothstep(0, margin, height - y)
    );

    return lerp(0.28, 1, fade);
  }

  function wrapFieldLensPosition(lens, bounds) {
    const margin = SIDE2_FIELD_EDGE_MARGIN;
    const minX = bounds.x - margin;
    const maxX = bounds.x + bounds.width + margin;
    const minY = bounds.y - margin;
    const maxY = bounds.y + bounds.height + margin;

    if (lens.x < minX) lens.x = maxX;
    else if (lens.x > maxX) lens.x = minX;

    if (lens.y < minY) lens.y = maxY;
    else if (lens.y > maxY) lens.y = minY;
  }

  function getFieldLensPresenceTarget(lens, now, progress, hasBody, focusState) {
    const stagePower = smoothstep(0.02, 1, progress);
    const life = 0.74
      + Math.sin(now * lens.lifeRate + lens.phase * 1.9) * 0.18
      + Math.sin(now * lens.lifeRate * 0.43 + lens.phase) * 0.08;
    const bodyLift = hasBody ? 1 : 0.58;
    const globalReveal = lerp(0.42, 1, stagePower);
    const focusScale = focusState ? focusState.presenceScale : 1;

    return clamp(life * bodyLift * globalReveal * focusScale, 0.035, 1.08);
  }

  function getCollectiveFieldPulse(lens, now, progress) {
    const global = Math.sin(now * SIDE2_FIELD_GLOBAL_PULSE_RATE + progress * 2.8);
    const localDelay = Math.sin(now * SIDE2_FIELD_GLOBAL_PULSE_RATE * 0.37 + lens.phase) * 0.28;
    return (global * 0.72 + localDelay) * lens.collectivePulseAmount;
  }

  function updateFieldTextureExchange(lens, bodyBounds, progress, now, dt) {
    if (!bodyIsPresent || !bodyBounds) {
      const sourceBlend = 1 - Math.exp(-dt / SIDE2_FIELD_SOURCE_DRIFT_SECONDS);
      lens.misPresence = lerp(lens.misPresence, 0, sourceBlend);
      lens.misX = lerp(lens.misX, lens.x, sourceBlend);
      lens.misY = lerp(lens.misY, lens.y, sourceBlend);
      return;
    }

    const mask = getCanvasMaskValue(lens.x, lens.y);
    const inside = smoothstep(0.16, 0.72, mask);
    const maskBlend = 1 - Math.exp(-dt / SIDE2_FIELD_MASK_BLEND_SECONDS);
    lens.maskBlend = lerp(lens.maskBlend || 0, inside, maskBlend);

    const targetBodySource = 1 - lens.maskBlend;
    lens.sourceBlend = lerp(lens.sourceBlend || 0, targetBodySource, maskBlend * 0.72);

    const environmentSource = getEnvironmentExchangeSource(lens, bodyBounds, now, progress);
    const bodySource = getBodyExchangeSource(lens, bodyBounds, now, progress);
    const targetX = lerp(environmentSource.x, bodySource.x, lens.sourceBlend);
    const targetY = lerp(environmentSource.y, bodySource.y, lens.sourceBlend);
    const sourceBlend = 1 - Math.exp(-dt / SIDE2_FIELD_SOURCE_DRIFT_SECONDS);
    const stagePower = smoothstep(0.04, 1, progress);
    const boundary = 1 - Math.abs(lens.maskBlend * 2 - 1);

    lens.misX = lerp(lens.misX, targetX, sourceBlend);
    lens.misY = lerp(lens.misY, targetY, sourceBlend);
    lens.misBaseAmount = lerp(0.38, 0.86, stagePower) * (0.78 + boundary * 0.28);
    lens.misPresence = lerp(lens.misPresence, lerp(0.42, 0.95, stagePower), sourceBlend);
    lens.misregister = true;
  }

  function getEnvironmentExchangeSource(lens, bodyBounds, now, progress) {
    const centerX = bodyBounds.x + bodyBounds.width * 0.5;
    const centerY = bodyBounds.y + bodyBounds.height * 0.52;
    let dx = lens.x - centerX;
    let dy = lens.y - centerY;
    const distance = Math.max(0.001, Math.hypot(dx, dy));
    dx /= distance;
    dy /= distance;

    const tangentX = -dy;
    const tangentY = dx;
    const bodyScale = Math.max(bodyBounds.width, bodyBounds.height);
    const outward = bodyScale * lerp(0.18, 0.48, hash1(lens.index, 1781)) * lerp(0.72, 1.16, smoothstep(0.1, 1, progress));
    const drift = bodyScale * lerp(0.025, 0.11, hash1(lens.index, 1783));
    const wave = now * lerp(0.00008, 0.0002, hash1(lens.index, 1785)) + lens.phase;

    return {
      x: clamp(lens.x + dx * outward + tangentX * Math.sin(wave) * drift, 0, canvas.width - 1),
      y: clamp(lens.y + dy * outward + tangentY * Math.cos(wave * 0.82) * drift, 0, canvas.height - 1)
    };
  }

  function getBodyExchangeSource(lens, bodyBounds, now, progress) {
    const centerX = bodyBounds.x + bodyBounds.width * 0.5;
    const centerY = bodyBounds.y + bodyBounds.height * 0.52;
    const bodyScale = Math.max(bodyBounds.width, bodyBounds.height);
    const pull = lerp(0.36, 0.82, hash1(lens.index, 1791));
    const wave = now * lerp(0.00007, 0.00018, hash1(lens.index, 1793)) + lens.phase;
    const orbit = bodyScale * lerp(0.015, 0.085, hash1(lens.index, 1795)) * smoothstep(0.08, 1, progress);
    const targetX = lerp(lens.x, centerX, pull) + Math.cos(wave) * orbit;
    const targetY = lerp(lens.y, centerY, pull) + Math.sin(wave * 0.77) * orbit * 0.72;

    return {
      x: clamp(targetX, bodyBounds.x, bodyBounds.x + bodyBounds.width),
      y: clamp(targetY, bodyBounds.y, bodyBounds.y + bodyBounds.height)
    };
  }

  function updateLensRedistributionScheduler(guides, targetCount, now, progress) {
    if (!guides.length || targetCount <= 0 || progress < SIDE2_LENS_REASSIGN_MIN_PROGRESS) return;
    if (now < side2LensNextRedistributionScanAt) return;

    const stagePower = smoothstep(SIDE2_LENS_REASSIGN_MIN_PROGRESS, 1, progress);
    const maxStarts = Math.max(1, Math.round(SIDE2_LENS_REASSIGN_MAX_STARTS * lerp(0.32, 1, stagePower)));
    const scanCount = Math.min(targetCount, Math.round(lerp(80, 260, stagePower)));
    let started = 0;

    for (let scan = 0; scan < scanCount && started < maxStarts; scan += 1) {
      side2LensRedistributionCursor = (side2LensRedistributionCursor + 1) % Math.max(1, targetCount);
      const lens = side2Lenses[side2LensRedistributionCursor];
      if (!lens || lens.redistributing || lens.presence < 0.18) continue;

      if (!lens.nextRedistributionAt) {
        scheduleLensRedistribution(lens, now, progress, true);
        continue;
      }

      if (now < lens.nextRedistributionAt) continue;
      if (beginLensRedistribution(lens, guides, now, progress)) started += 1;
    }

    side2LensNextRedistributionScanAt = now + lerp(
      SIDE2_LENS_REASSIGN_SCAN_INTERVAL_MS * 1.45,
      SIDE2_LENS_REASSIGN_SCAN_INTERVAL_MS,
      stagePower
    );
  }

  function scheduleLensRedistribution(lens, now, progress, initial) {
    const stagePower = smoothstep(SIDE2_LENS_REASSIGN_MIN_PROGRESS, 1, progress);
    const minDelay = lerp(SIDE2_LENS_REASSIGN_MAX_DELAY_MS * 0.82, SIDE2_LENS_REASSIGN_MIN_DELAY_MS, stagePower);
    const maxDelay = lerp(SIDE2_LENS_REASSIGN_MAX_DELAY_MS, SIDE2_LENS_REASSIGN_MAX_DELAY_MS * 0.48, stagePower);
    const seed = hash2(lens.index + lens.redistributionCycle * 19, lens.guideIndex + 173, initial ? 1601 : 1607);
    const initialSpread = initial ? lerp(0.35, 1.2, hash1(lens.index, 1609)) : 1;

    lens.nextRedistributionAt = now + lerp(minDelay, maxDelay, seed) * initialSpread;
  }

  function beginLensRedistribution(lens, guides, now, progress) {
    const targetGuideIndex = chooseLensRedistributionTarget(lens, guides, now, progress);
    if (targetGuideIndex === lens.guideIndex) {
      scheduleLensRedistribution(lens, now, progress, false);
      return false;
    }

    const stagePower = smoothstep(SIDE2_LENS_REASSIGN_MIN_PROGRESS, 1, progress);
    const seedA = hash2(lens.index + lens.redistributionCycle * 23, targetGuideIndex, 1613);
    const seedB = hash2(lens.guideIndex + 11, lens.redistributionCycle * 29, 1619);

    lens.redistributing = true;
    lens.redistributionStartedAt = now;
    lens.redistributionDuration = lerp(
      SIDE2_LENS_REASSIGN_MAX_DURATION_MS,
      SIDE2_LENS_REASSIGN_MIN_DURATION_MS,
      stagePower
    ) * lerp(0.82, 1.38, seedA);
    lens.redistributionSwapAt = now + lens.redistributionDuration * lerp(0.38, 0.56, seedB);
    lens.redistributionSwapped = false;
    lens.pendingGuideIndex = targetGuideIndex;
    lens.nextRedistributionAt = 0;
    return true;
  }

  function updateLensRedistributionTransition(lens, guides, bounds, now, progress, dt) {
    if (!lens.redistributing) return;

    if (!lens.redistributionSwapped && now >= lens.redistributionSwapAt) {
      assignLensGuide(lens, lens.pendingGuideIndex, guides, bounds, now, progress, dt);
      lens.redistributionSwapped = true;
    }

    if (now >= lens.redistributionStartedAt + lens.redistributionDuration) {
      lens.redistributing = false;
      lens.pendingGuideIndex = lens.guideIndex;
      lens.redistributionCycle += 1;
      scheduleLensRedistribution(lens, now, progress, false);
    }
  }

  function getLensRedistributionPresence(lens, now) {
    if (!lens.redistributing || lens.redistributionDuration <= 0) return 1;

    const progress = clamp((now - lens.redistributionStartedAt) / lens.redistributionDuration, 0, 1);
    if (progress < 0.5) {
      return Math.max(0.025, 1 - smoothstep(0.05, 0.46, progress) * 0.975);
    }

    return Math.max(0.025, smoothstep(0.5, 1, progress));
  }

  function chooseLensRedistributionTarget(lens, guides, now, progress) {
    const currentGuide = guides[lens.guideIndex] || null;
    const stagePower = smoothstep(SIDE2_LENS_REASSIGN_MIN_PROGRESS, 1, progress);
    const seedA = hash2(lens.index + lens.redistributionCycle * 31, Math.floor(now / 700), 1621);
    const seedB = hash2(lens.guideIndex + lens.redistributionCycle * 37, Math.floor(now / 1100), 1627);
    const currentFloating = Boolean(currentGuide && currentGuide.floating);
    let targetFloating = currentFloating;

    if (currentFloating) {
      targetFloating = seedA < lerp(0.58, 0.42, stagePower) ? false : true;
    } else {
      targetFloating = seedA < lerp(0.18, 0.42, stagePower);
    }

    return chooseLensGuideIndexByRole(guides, targetFloating, lens.guideIndex, seedB);
  }

  function chooseLensGuideIndexByRole(guides, wantsFloating, currentIndex, seed) {
    if (!guides.length) return currentIndex;

    const step = 37;
    let start = Math.floor(seed * guides.length) % guides.length;

    for (let attempt = 0; attempt < guides.length; attempt += 1) {
      const index = (start + attempt * step) % guides.length;
      const guide = guides[index];
      if (!guide || index === currentIndex) continue;
      if (Boolean(guide.floating) === wantsFloating) return index;
    }

    start = (start + 19) % guides.length;
    for (let attempt = 0; attempt < guides.length; attempt += 1) {
      const index = (start + attempt * 29) % guides.length;
      if (index !== currentIndex && guides[index]) return index;
    }

    return currentIndex;
  }

  function assignLensGuide(lens, guideIndex, guides, bounds, now, progress, dt) {
    const guide = guides[guideIndex] || guides[lens.guideIndex] || guides[0];
    if (!guide) return;

    const sourceMode = getLensSourceMode(guide, lens.index);
    const anchor = getInitialLensAnchorForGuide(guide, lens, bounds, now, progress, dt);
    const roleSeed = hash2(lens.index + guideIndex, lens.redistributionCycle + 167, 1637);

    lens.guideIndex = guideIndex;
    lens.name = guide.name;
    lens.type = guide.type;
    lens.floating = Boolean(guide.floating);
    lens.freeFloating = Boolean(guide.freeFloating);
    lens.released = Boolean(guide.released);
    lens.sourceMode = sourceMode;
    lens.misregister = sourceMode !== "local";
    lens.misPresence = 0;
    lens.misSourceGuideIndex = 0;
    lens.misNextSourceAt = 0;
    lens.misTargetReady = false;
    lens.pixelated = !guide.floating && roleSeed < SIDE2_LENS_PIXELATED_EDGE_RATIO;
    lens.crawling = !guide.floating && roleSeed > 0.38;
    lens.anchorSmoothing = SIDE2_LENS_ANCHOR_SMOOTHING_SECONDS * lerp(0.72, guide.floating ? 3.1 : guide.released ? 1.55 : 1.18, roleSeed);

    if (anchor) {
      lens.x = anchor.x;
      lens.y = anchor.y;
      lens.orientation = anchor.angle;
      lens.misX = anchor.x;
      lens.misY = anchor.y;
      lens.misTargetX = anchor.x;
      lens.misTargetY = anchor.y;
      lens.freeX = anchor.x;
      lens.freeY = anchor.y;
      lens.freeTargetX = anchor.x;
      lens.freeTargetY = anchor.y;
      lens.freeVx *= 0.18;
      lens.freeVy *= 0.18;
      lens.freeReady = false;
    }
  }

  function getInitialLensAnchorForGuide(guide, lens, bounds, now, progress, dt) {
    if (guide.floating) {
      return getBodyRelativeFloatingLensAnchor(guide, lens, bounds, now);
    }

    return getLensAnchor(guide, bounds) || getFallbackLensAnchor(guide, bounds);
  }

  function updateLensGlitchState(progress, now) {
    if (!side2LensGlitchState.nextAt) {
      side2LensGlitchState.nextAt = now + getNextLensGlitchDelay(progress);
    }

    if (side2LensGlitchState.active && now - side2LensGlitchState.startedAt >= side2LensGlitchState.duration) {
      side2LensGlitchState.active = false;
      side2LensGlitchState.recoveryUntil = now + side2LensGlitchState.duration * lerp(0.55, 1.35, Math.random());
      side2LensGlitchState.recoveryLevel = side2LensGlitchState.level;
      side2LensGlitchState.nextAt = now + getNextLensGlitchDelay(progress);
    }

    if (!side2LensGlitchState.active && now >= side2LensGlitchState.nextAt && progress > 0.04) {
      startLensGlitch(progress, now);
    }
  }

  function getNextLensGlitchDelay(progress) {
    const stagePower = smoothstep(0.12, 1, progress);
    return lerp(SIDE2_LENS_GLITCH_MICRO_MAX_DELAY, SIDE2_LENS_GLITCH_MICRO_MIN_DELAY, stagePower) * lerp(0.68, 1.8, Math.random());
  }

  function startLensGlitch(progress, now) {
    const stagePower = smoothstep(0.16, 1, progress);
    const roll = Math.random();
    let level = 1;
    let duration = lerp(110, 390, Math.random());

    if (stagePower > 0.62 && roll < SIDE2_LENS_GLITCH_GLOBAL_CHANCE) {
      level = 3;
      duration = lerp(560, 1650, Math.random());
    } else if (stagePower > 0.26 && roll < SIDE2_LENS_GLITCH_LOCAL_CHANCE + stagePower * 0.12) {
      level = 2;
      duration = lerp(260, 820, Math.random());
    }

    const regions = ["face", "hand", "arm", "neck", "shoulder", "torso", "leg"];
    const kinds = level === 3
      ? ["freeze", "strip", "misregister", "jump"]
      : level === 2
        ? ["jump", "misregister", "strip", "pixel"]
        : ["jump", "pixel", "misregister"];

    side2LensGlitchState.active = true;
    side2LensGlitchState.level = level;
    side2LensGlitchState.kind = kinds[Math.floor(Math.random() * kinds.length)] || "jump";
    side2LensGlitchState.region = regions[Math.floor(Math.random() * regions.length)] || "face";
    side2LensGlitchState.startedAt = now;
    side2LensGlitchState.duration = duration;
    side2LensGlitchState.seed = Math.random() * 10000;
  }

  function getLensGlitchInfluence(lens, guide, now) {
    const state = side2LensGlitchState;
    let envelope = 0;
    let level = state.level;

    if (state.active) {
      const progress = clamp((now - state.startedAt) / Math.max(1, state.duration), 0, 1);
      envelope = smoothstep(0, 0.08, progress) * (1 - smoothstep(0.72, 1, progress));
    } else if (now < state.recoveryUntil) {
      const progress = 1 - clamp((state.recoveryUntil - now) / Math.max(1, state.duration), 0, 1);
      envelope = (1 - smoothstep(0, 1, progress)) * 0.28;
      level = state.recoveryLevel;
    }

    if (envelope <= 0) return 0;
    if (!lens || !guide) return 0;
    if (level >= 3) return envelope * lerp(0.72, 1.25, hash1(lens.guideIndex, 381));

    const name = guide.name || lens.name || "";
    const score = hash2(lens.guideIndex + Math.floor(state.seed), name.length + level * 11, 853);

    if (level === 2) {
      if (isLensInGlitchRegion(name, state.region) || score > 0.76) {
        return envelope * lerp(0.42, 0.9, score);
      }
      return 0;
    }

    return score > 0.925 ? envelope * lerp(0.32, 0.68, score) : 0;
  }

  function isLensInGlitchRegion(name, region) {
    if (!name) return false;
    if (region === "face") {
      return name.includes("eye") || name.includes("nose") || name.includes("mouth") || name.includes("cheek") || name.includes("jaw") || name.includes("forehead") || name.includes("temple") || name.includes("hairline") || name.includes("crown") || name.includes("top-head") || name.includes("scalp") || name.includes("ear");
    }
    if (region === "hand") {
      return name.includes("hand") || name.includes("wrist") || name.includes("finger") || name.includes("palm") || name.includes("knuckle");
    }
    if (region === "arm") {
      return name.includes("forearm") || name.includes("upper-arm") || name.includes("elbow");
    }
    if (region === "neck") {
      return name.includes("neck") || name.includes("throat");
    }
    if (region === "shoulder") {
      return name.includes("shoulder");
    }
    if (region === "leg") {
      return name.includes("knee") || name.includes("calf") || name.includes("thigh") || name.includes("foot") || name.includes("ankle") || name.includes("leg") || name.includes("lowerleg");
    }
    return name.includes("torso") || name.includes("chest") || name.includes("abdomen") || name.includes("hip") || name.includes("back");
  }

  function updateLensOrganismInteractions(progress, now) {
    const stagePower = smoothstep(0.22, 1, progress);
    if (stagePower <= 0.02) return;
    if (now < side2LensNextInteractionAt) return;

    side2LensNextInteractionAt = now + lerp(SIDE2_LENS_INTERACTION_INTERVAL_MS * 1.35, SIDE2_LENS_INTERACTION_INTERVAL_MS, stagePower);

    const activeCount = Math.min(side2Lenses.length, getSide2LensCount(progress));
    let pairs = 0;
    let checks = 0;
    let scanned = 0;
    const bins = buildLensInteractionBins(activeCount);
    const maxChecks = Math.round(SIDE2_LENS_INTERACTION_MAX_CHECKS * lerp(0.46, 1, stagePower));

    for (let scan = 0; scan < activeCount && pairs < SIDE2_LENS_MERGE_MAX_PAIRS && checks < maxChecks; scan += 1) {
      const index = (side2LensInteractionCursor + scan) % activeCount;
      const first = side2Lenses[index];
      if (!first || first.floating || first.presence < 0.18) continue;

      scanned = scan + 1;
      const cellX = clamp(Math.floor(first.x / bins.cellSize), 0, bins.cols - 1);
      const cellY = clamp(Math.floor(first.y / bins.cellSize), 0, bins.rows - 1);

      for (let offsetY = -1; offsetY <= 1 && pairs < SIDE2_LENS_MERGE_MAX_PAIRS && checks < maxChecks; offsetY += 1) {
        const y = cellY + offsetY;
        if (y < 0 || y >= bins.rows) continue;

        for (let offsetX = -1; offsetX <= 1 && pairs < SIDE2_LENS_MERGE_MAX_PAIRS && checks < maxChecks; offsetX += 1) {
          const x = cellX + offsetX;
          if (x < 0 || x >= bins.cols) continue;

          const cell = bins.cells[y * bins.cols + x];
          for (let cellIndex = 0; cellIndex < cell.length && pairs < SIDE2_LENS_MERGE_MAX_PAIRS && checks < maxChecks; cellIndex += 1) {
            const secondIndex = cell[cellIndex];
            if (secondIndex <= index) continue;
            const second = side2Lenses[secondIndex];
            if (!second || second.floating || second.presence < 0.18) continue;
            checks += 1;

            const distance = Math.hypot(first.x - second.x, first.y - second.y);
            const combinedRadius = Math.max(1, first.radius + second.radius);
            const proximity = 1 - smoothstep(0.36, 0.98, distance / combinedRadius);
            if (proximity <= 0.01) continue;

            const pairSeed = index + secondIndex;
            const phase = 0.5 + Math.sin(now * lerp(0.00016, 0.00042, hash1(pairSeed, 405)) + first.phase + second.phase * 0.6) * 0.5;
            const merge = proximity * smoothstep(0.34, 0.9, phase) * stagePower * lerp(0.28, 0.82, hash1(pairSeed, 409));
            if (merge <= 0.02) continue;

            const larger = first.radius >= second.radius ? first : second;
            const smaller = larger === first ? second : first;
            const midX = (first.x + second.x) * 0.5;
            const midY = (first.y + second.y) * 0.5;

            larger.x = lerp(larger.x, midX, merge * 0.08);
            larger.y = lerp(larger.y, midY, merge * 0.08);
            smaller.x = lerp(smaller.x, midX, merge * 0.05);
            smaller.y = lerp(smaller.y, midY, merge * 0.05);
            larger.radius *= 1 + merge * 0.1;
            larger.strength *= 1 + merge * 0.12;
            larger.morphAmount += merge * 0.12;
            larger.pixelEdgeAmount += merge * 0.18;
            smaller.radius *= 1 - merge * 0.16;
            smaller.presence *= 1 - merge * 0.2;
            smaller.pixelEdgeAmount += merge * 0.12;

            if (phase > 0.82) {
              smaller.radius *= 1 + merge * 0.36;
              smaller.strength *= 1 + merge * 0.18;
              smaller.x += Math.cos(smaller.phase + now * 0.0003) * merge * smaller.radius * 0.28;
              smaller.y += Math.sin(smaller.phase + now * 0.00024) * merge * smaller.radius * 0.18;
            }

            pairs += 1;
          }
        }
      }
    }

    side2LensInteractionCursor = activeCount ? (side2LensInteractionCursor + Math.max(1, scanned)) % activeCount : 0;
  }

  function buildLensInteractionBins(activeCount) {
    const cellSize = SIDE2_LENS_INTERACTION_CELL_SIZE;
    const cols = Math.max(1, Math.ceil((canvas.width || 1) / cellSize));
    const rows = Math.max(1, Math.ceil((canvas.height || 1) / cellSize));
    const totalCells = cols * rows;
    const bins = side2LensInteractionBins;

    if (
      bins.cols !== cols
      || bins.rows !== rows
      || bins.cellSize !== cellSize
      || bins.cells.length !== totalCells
    ) {
      bins.cols = cols;
      bins.rows = rows;
      bins.cellSize = cellSize;
      bins.cells = new Array(totalCells);

      for (let index = 0; index < totalCells; index += 1) {
        bins.cells[index] = [];
      }
    } else {
      for (let index = 0; index < bins.cells.length; index += 1) {
        bins.cells[index].length = 0;
      }
    }

    for (let index = 0; index < activeCount; index += 1) {
      const lens = side2Lenses[index];
      if (!lens || lens.floating || lens.presence < 0.18) continue;

      const x = clamp(Math.floor(lens.x / cellSize), 0, cols - 1);
      const y = clamp(Math.floor(lens.y / cellSize), 0, rows - 1);
      bins.cells[y * cols + x].push(index);
    }

    return bins;
  }

  function getLensPresenceTarget(lens, guide, now, progress) {
    if (!guide.floating) return 1;

    const cycle = 0.5 + Math.sin(now * lens.lifeRate + lens.phase * 1.9) * 0.5;
    const life = smoothstep(0.06, 0.72, cycle) * (1 - smoothstep(0.9, 1, cycle) * 0.28);
    return lerp(0.34, 1, life) * lerp(0.72, 1, smoothstep(0.04, 1, progress));
  }

  function getLensRegionStrengthBoost(guide) {
    if (!guide || !guide.name) return 1;

    const name = guide.name;
    if (isDominantLensGuide(name)) return SIDE2_LENS_FACE_STRENGTH_BOOST * SIDE2_LENS_DOMINANT_FEATURE_BOOST;

    if (
      name.includes("eye")
      || name.includes("nose")
      || name.includes("cheek")
      || name.includes("mouth")
      || name.includes("jaw")
      || name.includes("forehead")
      || name.includes("hairline")
      || name.includes("crown")
      || name.includes("scalp")
      || name.includes("ear")
      || name.includes("temple")
      || name.includes("neck")
      || name.includes("throat")
      || name.includes("face")
    ) {
      return SIDE2_LENS_FACE_STRENGTH_BOOST;
    }

    if (
      name.includes("hand")
      || name.includes("wrist")
      || name.includes("finger")
      || name.includes("palm")
      || name.includes("knuckle")
    ) {
      return SIDE2_LENS_HAND_STRENGTH_BOOST;
    }

    if (name.includes("forearm") || name.includes("elbow") || name.includes("upper-arm")) return 1.18;
    if (name.includes("thigh") || name.includes("knee") || name.includes("calf") || name.includes("foot") || name.includes("ankle") || name.includes("lowerleg")) return 1.18;
    if (name.includes("torso") || name.includes("chest") || name.includes("hip") || name.includes("abdomen") || name.includes("back")) return 1.14;
    if (guide.floating) return 1.02;
    return 1.06;
  }

  function createOpticalLens(index) {
    const position = getInitialFieldLensPosition(index);
    const type = Math.floor(hash1(index, 300) * 8);
    const phase = hash1(index, 325) * Math.PI * 2;
    const radiusRoll = hash1(index, 301);
    const baseRadius = radiusRoll < 0.56
      ? lerp(0.005, 0.013, hash1(index, 302))
      : radiusRoll < 0.88
        ? lerp(0.013, 0.029, hash1(index, 303))
        : lerp(0.029, 0.062, hash1(index, 304));
    const baseAspect = lerp(0.58, 2.05, hash1(index, 305));

    return {
      index,
      guideIndex: index,
      name: "field-organism-" + index,
      type,
      floating: false,
      freeFloating: false,
      released: false,
      fieldReady: false,
      baseRadius,
      baseAspect,
      baseStrength: lerp(0.62, 1.38, hash1(index, 306)),
      baseTwist: lerp(-0.28, 0.28, hash1(index, 307)),
      baseBlur: hash1(index, 308) > 0.9 ? lerp(0.04, 0.14, hash1(index, 309)) : 0,
      sourceMode: "exchange",
      misregister: true,
      misPresence: 0,
      misX: position.x,
      misY: position.y,
      misTargetX: position.x,
      misTargetY: position.y,
      misTargetReady: true,
      misSourceGuideIndex: 0,
      misNextSourceAt: 0,
      misBaseAmount: lerp(0.42, 0.82, hash1(index, 326)),
      misDriftRate: lerp(0.0001, 0.00028, hash1(index, 327)),
      misWander: lerp(0.016, 0.045, hash1(index, 328)),
      environmentAngle: hash1(index, 331) * Math.PI * 2,
      environmentDistance: lerp(0.055, 0.18, hash1(index, 332)),
      sourceUpdateGroup: index % SIDE2_LENS_SOURCE_UPDATE_GROUPS,
      glitchAmount: 0,
      glitchJumpAmount: lerp(0.01, 0.055, hash1(index, 352)),
      glitchScaleAmount: lerp(0.12, 0.44, hash1(index, 353)),
      glitchAspectAmount: lerp(-0.55, 1.25, hash1(index, 354)),
      glitchRotation: lerp(-0.42, 0.42, hash1(index, 355)),
      glitchSampleShiftX: 0,
      glitchSampleShiftY: 0,
      x: position.x,
      y: position.y,
      previousX: position.x,
      previousY: position.y,
      vx: Math.cos(phase) * 8,
      vy: Math.sin(phase * 1.37) * 8,
      maskBlend: 0,
      sourceBlend: 0,
      stagnation: 0,
      fieldAlphaScale: 0.6,
      fieldDensityBias: lerp(0.78, 1.24, hash1(index, 1801)),
      fieldFaceCoverBias: hash1(index, 1803) > 0.64 ? lerp(0.58, 1.18, hash1(index, 1805)) : lerp(0.08, 0.34, hash1(index, 1807)),
      fieldFocusRole: hash1(index, 1809),
      skeletonRouteFamily: hash1(index, 1821),
      skeletonRouteSeed: hash1(index, 1823),
      skeletonRoutePhase: hash1(index, 1825),
      skeletonRouteRate: lerp(0.000018, 0.000072, hash1(index, 1827)),
      skeletonRouteSwitchRate: lerp(0.000014, 0.000038, hash1(index, 1829)),
      skeletonDirection: hash1(index, 1831) > 0.5 ? 1 : -1,
      skeletonPathWidth: lerp(0.34, 1.12, hash1(index, 1833)),
      skeletonAttraction: lerp(0.68, 1.24, hash1(index, 1835)),
      skeletonDetachRate: lerp(0.000035, 0.000105, hash1(index, 1837)),
      skeletonDetachAmount: lerp(0.08, 0.42, hash1(index, 1839)),
      skeletonOrbitRate: lerp(0.000075, 0.00024, hash1(index, 1841)),
      skeletonPulseRate: lerp(0.00008, 0.00022, hash1(index, 1843)),
      radius: 26,
      aspect: baseAspect,
      orientation: phase,
      orientationOffset: lerp(-0.34, 0.34, hash1(index, 311)),
      strength: 0,
      twist: 0,
      blur: 0,
      presence: 0,
      anchorSmoothing: SIDE2_LENS_ANCHOR_SMOOTHING_SECONDS * lerp(1.6, 3.4, hash1(index, 312)),
      paramSmoothing: SIDE2_LENS_PARAM_SMOOTHING_SECONDS * lerp(0.75, 1.45, hash1(index, 313)),
      radiusPulse: lerp(0.018, 0.052, hash1(index, 314)),
      collectivePulseAmount: lerp(0.018, 0.075, hash1(index, 315)),
      orbitAmount: lerp(0.018, 0.045, hash1(index, 315)),
      driftAmount: lerp(0.0015, 0.007, hash1(index, 316)),
      releaseOrbitAmount: 0,
      releaseDriftAmount: 0,
      localDriftPixels: lerp(2, 9, hash1(index, 329)),
      rotationWobble: lerp(0.015, 0.11, hash1(index, 317)),
      pulseRate: lerp(0.00008, 0.00028, hash1(index, 318)),
      secondaryPulseRate: lerp(0.000045, 0.00016, hash1(index, 356)),
      orbitRate: lerp(0.00012, 0.00042, hash1(index, 319)),
      driftRate: lerp(0.00018, 0.00056, hash1(index, 320)),
      lifeRate: lerp(0.00004, 0.00016, hash1(index, 330)),
      aspectRate: lerp(0.00022, 0.00068, hash1(index, 321)),
      aspectPulse: lerp(0.026, 0.11, hash1(index, 357)),
      morphRate: lerp(0.000035, 0.00016, hash1(index, 358)),
      morphAspect: lerp(0.03, 0.145, hash1(index, 359)),
      baseMorphAmount: lerp(0.04, 0.16, hash1(index, 360)),
      morphAmount: 0,
      morphPhase: 0,
      morphSeedA: lerp(1.8, 3.4, hash1(index, 361)),
      morphSeedB: lerp(3.2, 5.8, hash1(index, 362)),
      pixelated: hash1(index, 363) < SIDE2_LENS_PIXELATED_EDGE_RATIO,
      pixelEdgeAmount: 0,
      pixelSize: lerp(2.2, 7.5, hash1(index, 364)),
      pixelSalt: Math.floor(hash1(index, 365) * 10000),
      edgeScatter: lerp(0.012, 0.075, hash1(index, 366)),
      crawling: false,
      crawlPixels: 0,
      crawlRate: 0,
      crawlWobbleRate: 0,
      crawlPulseRate: 0,
      crawlPhase: 0,
      redistributing: false,
      redistributionStartedAt: 0,
      redistributionDuration: 0,
      redistributionSwapAt: 0,
      redistributionSwapped: false,
      pendingGuideIndex: index,
      nextRedistributionAt: 0,
      redistributionCycle: 0,
      strengthRate: lerp(0.00018, 0.00055, hash1(index, 322)),
      rotationRate: lerp(0.00012, 0.00046, hash1(index, 323)),
      twistRate: lerp(0.00018, 0.00052, hash1(index, 324)),
      phase
    };
  }

  function updateMisregistrationSource(lens, guide, guides, bounds, sourceBounds, bodyScale, progress, now, dt, shouldRefresh) {
    if (!lens.misregister) return;

    if (shouldRefresh) {
      if (lens.sourceMode === "environment") {
        refreshEnvironmentLensSourceTarget(lens, guide, bounds, sourceBounds, bodyScale, progress, now);
      } else {
        if (!lens.misNextSourceAt || now >= lens.misNextSourceAt) {
          lens.misSourceGuideIndex = chooseMisregistrationSourceIndex(guides, guide, lens);
          lens.misNextSourceAt = now + lerp(2200, 6200, hash1(lens.guideIndex, Math.floor(now / 1000) + 390));
        }

        const sourceGuide = guides[lens.misSourceGuideIndex] || guide;
        const anchor = getLensAnchor(sourceGuide, bounds) || getFallbackLensAnchor(sourceGuide, bounds);
        const drift = bodyScale * lens.misWander * lerp(0.44, 1, smoothstep(0.24, 1, progress));
        lens.misTargetX = anchor.x + Math.sin(now * lens.misDriftRate + lens.phase * 1.8) * drift;
        lens.misTargetY = anchor.y + Math.cos(now * lens.misDriftRate * 0.79 + lens.phase) * drift * 0.72;
        lens.misTargetReady = true;
      }
    }

    if (!lens.misTargetReady) {
      lens.misTargetX = lens.misX;
      lens.misTargetY = lens.misY;
      lens.misTargetReady = true;
    }

    const sourceBlend = 1 - Math.exp(-dt / SIDE2_LENS_MISREGISTRATION_DRIFT_SECONDS);

    lens.misX = lerp(lens.misX, lens.misTargetX, sourceBlend);
    lens.misY = lerp(lens.misY, lens.misTargetY, sourceBlend);
  }

  function refreshEnvironmentLensSourceTarget(lens, guide, bounds, sourceBounds, bodyScale, progress, now) {
    const safeBounds = sourceBounds || { x: 0, y: 0, width: canvas.width || 1, height: canvas.height || 1 };
    const bodyBounds = bounds || safeBounds;
    const centerX = bodyBounds.x + bodyBounds.width * 0.5;
    const centerY = bodyBounds.y + bodyBounds.height * 0.5;
    let outwardX = lens.x - centerX;
    let outwardY = lens.y - centerY;
    const outwardLength = Math.hypot(outwardX, outwardY);

    if (outwardLength > 0.001) {
      outwardX /= outwardLength;
      outwardY /= outwardLength;
    } else {
      outwardX = Math.cos(lens.environmentAngle);
      outwardY = Math.sin(lens.environmentAngle);
    }

    const tangentX = -outwardY;
    const tangentY = outwardX;
    const stagePower = smoothstep(0.04, 1, progress);
    const distance = bodyScale * lens.environmentDistance * lerp(0.72, 1.18, stagePower);
    const edgeX = outwardX > 0
      ? (bodyBounds.x + bodyBounds.width - centerX) / outwardX
      : outwardX < 0
        ? (bodyBounds.x - centerX) / outwardX
        : Infinity;
    const edgeY = outwardY > 0
      ? (bodyBounds.y + bodyBounds.height - centerY) / outwardY
      : outwardY < 0
        ? (bodyBounds.y - centerY) / outwardY
        : Infinity;
    const edgeDistance = Math.min(
      edgeX > 0 ? edgeX : Infinity,
      edgeY > 0 ? edgeY : Infinity
    );
    const environmentDistance = Math.max(
      distance,
      (Number.isFinite(edgeDistance) ? edgeDistance : distance) + Math.min(bodyScale * 0.075, SIDE2_LENS_EFFECT_MARGIN * 1.1) * lerp(0.58, 1.1, stagePower)
    );
    const wander = bodyScale * lens.misWander * lerp(0.42, 0.95, stagePower);
    const driftA = Math.sin(now * lens.misDriftRate + lens.phase * 1.8);
    const driftB = Math.cos(now * lens.misDriftRate * 0.73 + lens.phase);
    const targetX = clamp(
      centerX + outwardX * environmentDistance + tangentX * driftA * wander + driftB * wander * 0.24,
      safeBounds.x,
      safeBounds.x + safeBounds.width
    );
    const targetY = clamp(
      centerY + outwardY * environmentDistance + tangentY * driftA * wander * 0.72 + driftB * wander * 0.2,
      safeBounds.y,
      safeBounds.y + safeBounds.height
    );

    lens.misTargetX = targetX;
    lens.misTargetY = targetY;
    lens.misTargetReady = true;
  }

  function getLensSourceMode(guide, index) {
    if (!guide) return "local";

    if (guide.floating) {
      return hash1(index, 418) < SIDE2_LENS_FLOATING_BODY_SAMPLE_RATIO ? "body" : "local";
    }

    if (guide.misregister || getMisregistrationLensNames().includes(guide.name)) {
      return "body";
    }

    if (isTorsoEnvironmentLensGuide(guide.name)) {
      return hash1(index, 419) < SIDE2_LENS_TORSO_ENVIRONMENT_RATIO ? "environment" : "body";
    }

    return hash1(index, 419) < SIDE2_LENS_BODY_ENVIRONMENT_RATIO ? "environment" : "body";
  }

  function getLensSourcePresence(lens, progress, glitch) {
    const stagePower = smoothstep(0.04, 1, progress);

    if (lens.sourceMode === "environment") {
      return Math.max(lerp(0.56, 0.97, stagePower), glitch * 0.9);
    }

    if (lens.sourceMode === "body") {
      return Math.max(lerp(0.42, 0.88, stagePower), glitch * 0.95);
    }

    return glitch * 0.5;
  }

  function chooseMisregistrationSourceIndex(guides, currentGuide, lens) {
    return chooseBodySourceGuideIndex(guides, lens.guideIndex, currentGuide.name);
  }

  function chooseBodySourceGuideIndex(guides, seed, currentName) {
    const candidates = side2BodySourceGuideIndexes.length
      ? side2BodySourceGuideIndexes
      : buildBodySourceGuideIndexes(guides);

    if (!candidates.length) return 0;

    const pick = Math.floor(hash1((seed || 0) + candidates.length, Math.random() * 977) * candidates.length);
    const candidate = candidates[pick] ?? candidates[0];
    const guide = guides[candidate];
    if (guide && guide.name !== currentName) return candidate;

    for (let attempt = 1; attempt < Math.min(5, candidates.length); attempt += 1) {
      const alternate = candidates[(pick + attempt * 17) % candidates.length];
      const alternateGuide = guides[alternate];
      if (alternateGuide && alternateGuide.name !== currentName) return alternate;
    }

    return candidate;
  }

  function buildBodySourceGuideIndexes(guides) {
    const indexes = [];

    for (let index = 0; index < guides.length; index += 1) {
      const guide = guides[index];
      if (!guide || guide.floating) continue;
      if (!isMisregistrationSourceGuide(guide.name)) continue;
      indexes.push(index);
    }

    return indexes;
  }

  function isMisregistrationLensGuide(guide, index) {
    if (!guide || guide.floating || index >= SIDE2_LENS_MAX_COUNT) return false;

    return Boolean(guide.misregister) || getMisregistrationLensNames().includes(guide.name);
  }

  function getMisregistrationLensNames() {
    return [
      "left-eye",
      "mouth",
      "right-eye",
      "nose-bridge",
      "left-hand",
      "left-palm-broad",
      "left-index-finger",
      "right-finger-line",
      "right-palm-pin",
      "right-elbow-slice",
      "front-neck-small",
      "forehead-right-oval",
      "top-head-wide-right",
      "right-cheek-wide",
      "left-neck-river"
    ].slice(0, SIDE2_LENS_MISREGISTRATION_COUNT);
  }

  function countMisregistrationGuidesBefore(index) {
    const guides = getSide2LensGuides();
    let count = 0;

    for (let guideIndex = 0; guideIndex < index; guideIndex += 1) {
      const guide = guides[guideIndex];
      if (
        guide
        && !guide.floating
        && (
          isDominantLensGuide(guide.name)
          || guide.name === "left-hand"
          || guide.name === "right-hand"
        )
      ) {
        count += 1;
      }
    }

    return count;
  }

  function isDominantLensGuide(name) {
    return name === "left-eye"
      || name === "right-eye"
      || name === "nose-bridge"
      || name === "mouth"
      || name === "jaw";
  }

  function isMisregistrationSourceGuide(name) {
    return Boolean(
      name
        && !name.includes("soft")
        && (
          name.includes("eye")
          || name.includes("nose")
          || name.includes("cheek")
          || name.includes("mouth")
          || name.includes("jaw")
          || name.includes("forehead")
          || name.includes("hairline")
          || name.includes("crown")
          || name.includes("scalp")
          || name.includes("ear")
          || name.includes("temple")
          || name.includes("neck")
          || name.includes("throat")
          || name.includes("top-head")
          || name.includes("shoulder")
          || name.includes("elbow")
          || name.includes("hand")
          || name.includes("wrist")
          || name.includes("finger")
          || name.includes("palm")
          || name.includes("knuckle")
          || name.includes("forearm")
          || name.includes("upper-arm")
          || name.includes("chest")
          || name.includes("back")
          || name.includes("abdomen")
          || name.includes("hip")
          || name.includes("thigh")
          || name.includes("knee")
          || name.includes("calf")
          || name.includes("ankle")
          || name.includes("foot")
          || name.includes("lowerleg")
        )
    );
  }

  function isTorsoEnvironmentLensGuide(name) {
    return Boolean(
      name
        && (
          name.includes("torso")
          || name.includes("chest")
          || name.includes("abdomen")
          || name.includes("stomach")
          || name.includes("back")
          || name.includes("rib")
          || name.includes("hip")
        )
    );
  }

  function resetLensBubbles() {
    for (let index = 0; index < side2LensBubbles.length; index += 1) {
      releaseLensBubble(side2LensBubbles[index]);
    }

    side2LensBubbles.length = 0;
    side2LensBubbleHands = {
      left: { x: null, y: null, lastSpawnAt: 0 },
      right: { x: null, y: null, lastSpawnAt: 0 }
    };
    side2NextSpontaneousBubbleAt = 0;
  }

  function resetLensGlitchState() {
    side2LensGlitchState = {
      active: false,
      level: 0,
      kind: "micro",
      region: "body",
      startedAt: 0,
      duration: 0,
      nextAt: 0,
      seed: 0,
      recoveryUntil: 0,
      recoveryLevel: 0
    };
  }

  function updateTemporaryLensBubbles(progress, now, dt) {
    const limit = getLensBubbleLimit(progress);
    const stagePower = smoothstep(0.08, 1, progress);
    let writeIndex = 0;

    for (let index = 0; index < side2LensBubbles.length; index += 1) {
      const bubble = side2LensBubbles[index];
      const age = now - bubble.birth;
      if (age >= bubble.lifetime) {
        releaseLensBubble(bubble);
        continue;
      }

      const life = clamp(age / bubble.lifetime, 0, 1);
      const appear = smoothstep(0, 0.18, life);
      const dissolve = 1 - smoothstep(0.64, 1, life);
      const pulse = Math.sin(now * bubble.pulseRate + bubble.phase);
      const wanderX = Math.cos(now * bubble.wanderRate + bubble.phase * 1.7) * bubble.wander;
      const wanderY = Math.sin(now * bubble.wanderRate * 0.83 + bubble.phase) * bubble.wander * 0.68;

      bubble.x += bubble.vx * dt + wanderX * dt;
      bubble.y += bubble.vy * dt + wanderY * dt;
      bubble.vx *= Math.exp(-dt * bubble.drag);
      bubble.vy = bubble.vy * Math.exp(-dt * bubble.drag * 0.8) + bubble.floatY * dt;
      bubble.orientation += bubble.spin * dt;
      bubble.presence = appear * dissolve * (0.72 + stagePower * 0.28);
      bubble.radius = bubble.baseRadius * (1 + smoothstep(0, 0.34, life) * bubble.growth - smoothstep(0.7, 1, life) * bubble.shrink + pulse * 0.035);
      bubble.strength = bubble.baseStrength * bubble.presence * (1 + pulse * 0.14);
      bubble.twist = bubble.baseTwist * (0.8 + Math.cos(now * bubble.pulseRate * 0.7 + bubble.phase) * 0.2);
      updateBubbleBodySource(bubble, progress, now, dt);

      side2LensBubbles[writeIndex] = bubble;
      writeIndex += 1;
    }

    side2LensBubbles.length = writeIndex;
    if (limit <= 0) return;

    updateHandLensBubbleTrail("left", POSE_LANDMARKS.leftWrist, progress, now, limit);
    updateHandLensBubbleTrail("right", POSE_LANDMARKS.rightWrist, progress, now, limit);
    updateSpontaneousLensBubbles(progress, now, limit);
  }

  function updateHandLensBubbleTrail(side, landmarkIndex, progress, now, limit) {
    const point = getPosePoint(landmarkIndex);
    const state = side2LensBubbleHands[side];
    if (!state || !point) {
      if (state) {
        state.x = null;
        state.y = null;
      }
      return;
    }

    if (state.x === null || state.y === null) {
      state.x = point.x;
      state.y = point.y;
      state.lastSpawnAt = now;
      return;
    }

    const dx = point.x - state.x;
    const dy = point.y - state.y;
    const distance = Math.hypot(dx, dy);
    const stagePower = smoothstep(0.08, 1, progress);
    const threshold = SIDE2_LENS_BUBBLE_HAND_DISTANCE * lerp(1.45, 0.72, stagePower);
    const cooldown = SIDE2_LENS_BUBBLE_HAND_COOLDOWN * lerp(1.7, 0.82, stagePower);

    if (distance > threshold && now - state.lastSpawnAt > cooldown && side2LensBubbles.length < limit) {
      const spawnCount = distance > threshold * 2.35 && progress > 0.45 ? 2 : 1;

      for (let index = 0; index < spawnCount && side2LensBubbles.length < limit; index += 1) {
        const trailT = lerp(0.08, 0.54, Math.random());
        const offset = lerp(4, 18, Math.random()) * (Math.random() < 0.5 ? -1 : 1);
        spawnLensBubble({
          x: lerp(state.x, point.x, trailT) + offset * 0.4,
          y: lerp(state.y, point.y, trailT) + offset * 0.22,
          vx: -dx * lerp(1.2, 2.45, Math.random()) + lerp(-12, 12, Math.random()),
          vy: -dy * lerp(0.85, 1.75, Math.random()) + lerp(-10, 16, Math.random()),
          progress,
          now,
          source: "hand"
        });
      }

      state.lastSpawnAt = now;
    }

    state.x = point.x;
    state.y = point.y;
  }

  function updateSpontaneousLensBubbles(progress, now, limit) {
    if (progress < 0.16 || side2LensBubbles.length >= limit) return;

    if (!side2NextSpontaneousBubbleAt) {
      side2NextSpontaneousBubbleAt = now + getNextSpontaneousBubbleDelay(progress);
      return;
    }

    if (now < side2NextSpontaneousBubbleAt) return;

    spawnSpontaneousLensBubble(progress, now);
    side2NextSpontaneousBubbleAt = now + getNextSpontaneousBubbleDelay(progress);
  }

  function spawnSpontaneousLensBubble(progress, now) {
    const guides = getSide2LensGuides();
    const bounds = getLocalEffectBounds(0);
    if (!bounds) return;

    const bodyScale = Math.max(bounds.width, bounds.height);
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const guide = guides[Math.floor(Math.random() * guides.length)];
      if (!guide || guide.floating) continue;
      const anchor = getLensAnchor(guide, bounds) || getFallbackLensAnchor(guide, bounds);
      const angle = Math.random() * Math.PI * 2;
      const distance = bodyScale * lerp(0.018, 0.1, Math.random()) * lerp(0.45, 1.1, progress);

      spawnLensBubble({
        x: anchor.x + Math.cos(angle) * distance,
        y: anchor.y + Math.sin(angle) * distance,
        vx: Math.cos(angle) * lerp(4, 22, Math.random()),
        vy: Math.sin(angle) * lerp(2, 14, Math.random()) - lerp(2, 14, Math.random()),
        progress,
        now,
        source: "body"
      });
      return;
    }
  }

  function spawnLensBubble(options) {
    const limit = getLensBubbleLimit(options.progress);
    if (side2LensBubbles.length >= limit || side2LensBubbles.length >= SIDE2_LENS_BUBBLE_MAX_COUNT) return;

    const stagePower = smoothstep(0.08, 1, options.progress);
    const radius = getLensBubbleRadius(options.source, stagePower);
    const lifetime = lerp(SIDE2_LENS_BUBBLE_MIN_LIFETIME, SIDE2_LENS_BUBBLE_MAX_LIFETIME, Math.random());
    const type = getLensBubbleType();
    const handBoost = options.source === "hand" ? 1.14 : 0.94;
    const sourceMode = Math.random() < SIDE2_LENS_FLOATING_BODY_SAMPLE_RATIO ? "body" : "local";
    const bubble = side2LensBubblePool.pop() || {};

    bubble.x = options.x;
    bubble.y = options.y;
    bubble.vx = options.vx;
    bubble.vy = options.vy;
    bubble.birth = options.now;
    bubble.lifetime = lifetime;
    bubble.baseRadius = radius;
    bubble.radius = radius;
    bubble.aspect = lerp(0.82, 1.24, Math.random());
    bubble.orientation = Math.random() * Math.PI * 2;
    bubble.spin = lerp(-0.22, 0.22, Math.random());
    bubble.type = type;
    bubble.baseStrength = lerp(0.38, 0.86, Math.random()) * lerp(0.58, 1.08, stagePower) * handBoost;
    bubble.strength = 0;
    bubble.sourceMode = sourceMode;
    bubble.misregister = sourceMode === "body";
    bubble.misPresence = sourceMode === "body" ? 1 : 0;
    bubble.misX = options.x;
    bubble.misY = options.y;
    bubble.misTargetX = options.x;
    bubble.misTargetY = options.y;
    bubble.misTargetReady = false;
    bubble.misSourceGuideIndex = 0;
    bubble.misNextSourceAt = 0;
    bubble.misBaseAmount = lerp(0.48, 0.82, Math.random());
    bubble.misDriftRate = lerp(0.00012, 0.00032, Math.random());
    bubble.misWander = lerp(0.012, 0.036, Math.random());
    bubble.baseTwist = lerp(-0.32, 0.32, Math.random());
    bubble.twist = 0;
    bubble.edgeSoftness = lerp(0.36, 0.52, Math.random());
    bubble.blur = Math.random() < 0.12 ? lerp(0.08, 0.18, Math.random()) : 0;
    bubble.presence = 0;
    bubble.growth = lerp(0.08, 0.26, Math.random());
    bubble.shrink = lerp(0.18, 0.46, Math.random());
    bubble.drag = lerp(0.38, 0.82, Math.random());
    bubble.floatY = lerp(-4, 10, Math.random());
    bubble.wander = lerp(5, 24, Math.random());
    bubble.wanderRate = lerp(0.00045, 0.00125, Math.random());
    bubble.pulseRate = lerp(0.0014, 0.0034, Math.random());
    bubble.phase = Math.random() * Math.PI * 2;
    bubble.floating = true;
    bubble.bubble = true;
    bubble.name = options.source === "hand" ? "trail-bubble" : "body-bubble";

    side2LensBubbles.push(bubble);
  }

  function releaseLensBubble(bubble) {
    if (!bubble || side2LensBubblePool.length >= SIDE2_LENS_BUBBLE_MAX_COUNT * 2) return;
    side2LensBubblePool.push(bubble);
  }

  function updateBubbleBodySource(bubble, progress, now, dt) {
    if (!bubble || bubble.sourceMode !== "body") return;

    const guides = getSide2LensGuides();
    const bounds = getLocalEffectBounds(0);
    const bodyScale = bounds ? Math.max(bounds.width, bounds.height) : Math.max(canvas.width || 1, canvas.height || 1);

    if (!bubble.misNextSourceAt || now >= bubble.misNextSourceAt) {
      bubble.misSourceGuideIndex = chooseBodySourceGuideIndex(guides, bubble.phase || 0, bubble.name || "");
      bubble.misNextSourceAt = now + lerp(1500, 4700, Math.random());

      const sourceGuide = guides[bubble.misSourceGuideIndex] || guides[0];
      const anchor = getLensAnchor(sourceGuide, bounds) || getFallbackLensAnchor(sourceGuide, bounds);
      const drift = bodyScale * bubble.misWander * lerp(0.46, 1, smoothstep(0.12, 1, progress));
      bubble.misTargetX = anchor.x + Math.sin(now * bubble.misDriftRate + bubble.phase * 1.4) * drift;
      bubble.misTargetY = anchor.y + Math.cos(now * bubble.misDriftRate * 0.83 + bubble.phase) * drift * 0.72;
      bubble.misTargetReady = true;
    }

    if (!bubble.misTargetReady) {
      bubble.misTargetX = bubble.misX;
      bubble.misTargetY = bubble.misY;
      bubble.misTargetReady = true;
    }

    const sourceBlend = 1 - Math.exp(-dt / SIDE2_LENS_MISREGISTRATION_DRIFT_SECONDS);

    bubble.misX = lerp(bubble.misX, bubble.misTargetX, sourceBlend);
    bubble.misY = lerp(bubble.misY, bubble.misTargetY, sourceBlend);
  }

  function getLensBubbleLimit(progress) {
    const stage = getStage(progress);
    const stageStart = stage === 1 ? 0 : stage === 2 ? 0.2 : stage === 3 ? 0.4 : stage === 4 ? 0.6 : 0.82;
    const stageEnd = stage === 1 ? 0.2 : stage === 2 ? 0.4 : stage === 3 ? 0.6 : stage === 4 ? 0.82 : 1;
    const previousLimit = SIDE2_LENS_BUBBLE_STAGE_LIMITS[Math.max(0, stage - 1)];
    const nextLimit = SIDE2_LENS_BUBBLE_STAGE_LIMITS[stage];

    return Math.min(
      SIDE2_LENS_BUBBLE_MAX_COUNT,
      Math.round(lerp(previousLimit, nextLimit, smoothstep(stageStart, stageEnd, progress)))
    );
  }

  function getLensBubbleRadius(source, stagePower) {
    const roll = Math.random();
    const stageSize = lerp(0.82, 1.12, stagePower);
    if (roll < 0.68) return lerp(8, 16, Math.random()) * stageSize;
    if (roll < 0.92) return lerp(16, 28, Math.random()) * stageSize;
    return lerp(30, source === "hand" ? 42 : 45, Math.random()) * stageSize;
  }

  function getLensBubbleType() {
    const roll = Math.random();
    if (roll < 0.2) return 0;
    if (roll < 0.38) return 4;
    if (roll < 0.56) return 5;
    if (roll < 0.7) return 2;
    if (roll < 0.82) return 3;
    if (roll < 0.92) return 6;
    return 7;
  }

  function getNextSpontaneousBubbleDelay(progress) {
    const stagePower = smoothstep(0.16, 1, progress);
    return lerp(SIDE2_LENS_BUBBLE_SPONTANEOUS_MAX_INTERVAL, SIDE2_LENS_BUBBLE_SPONTANEOUS_MIN_INTERVAL, stagePower) * lerp(0.72, 1.45, Math.random());
  }

  function ensureOutwardEmissionPool() {
    while (side2EmissionFragments.length < SIDE2_EMISSION_FRAGMENT_MAX_COUNT) {
      side2EmissionFragments.push(createOutwardEmissionFragment());
    }
  }

  function createOutwardEmissionFragment() {
    const fragmentCanvas = document.createElement("canvas");
    fragmentCanvas.width = SIDE2_EMISSION_FRAGMENT_CANVAS_SIZE;
    fragmentCanvas.height = SIDE2_EMISSION_FRAGMENT_CANVAS_SIZE;
    const fragmentCtx = fragmentCanvas.getContext("2d");
    fragmentCtx.imageSmoothingEnabled = false;

    return {
      active: false,
      canvas: fragmentCanvas,
      ctx: fragmentCtx,
      birth: 0,
      life: 0,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      size: 0,
      aspect: 1,
      rotation: 0,
      spin: 0,
      alpha: 0,
      drag: 1.2
    };
  }

  function resetOutwardEmissionFragments() {
    side2EmissionArmState = {
      left: { distance: null, velocity: 0, lastEmitAt: -Infinity },
      right: { distance: null, velocity: 0, lastEmitAt: -Infinity }
    };

    for (let index = 0; index < side2EmissionFragments.length; index += 1) {
      side2EmissionFragments[index].active = false;
    }
  }

  function updateOutwardEmissionFragments(progress, now, dt) {
    ensureOutwardEmissionPool();

    for (let index = 0; index < side2EmissionFragments.length; index += 1) {
      const fragment = side2EmissionFragments[index];
      if (!fragment.active) continue;

      const age = now - fragment.birth;
      if (age < 0) continue;
      if (age >= fragment.life) {
        fragment.active = false;
        continue;
      }

      fragment.x += fragment.vx * dt;
      fragment.y += fragment.vy * dt;
      fragment.vx *= Math.exp(-dt * fragment.drag);
      fragment.vy *= Math.exp(-dt * fragment.drag * 0.9);
      fragment.y += dt * lerp(-2, 7, smoothstep(0.2, 1, progress));
      fragment.rotation += fragment.spin * dt;
    }

    const stagePower = smoothstep(SIDE2_EMISSION_MIN_PROGRESS, 1, progress);
    if (stagePower <= 0.01 || side2LensQuality < 0.54) return;

    const center = getOutwardEmissionBodyCenter();
    if (!center) return;

    const bodyScale = getOutwardEmissionBodyScale();
    updateOutwardEmissionArm("left", progress, now, dt, center, bodyScale);
    updateOutwardEmissionArm("right", progress, now, dt, center, bodyScale);
  }

  function updateOutwardEmissionArm(side, progress, now, dt, center, bodyScale) {
    const wrist = getPosePoint(side === "left" ? POSE_LANDMARKS.leftWrist : POSE_LANDMARKS.rightWrist);
    const elbow = getPosePoint(side === "left" ? POSE_LANDMARKS.leftElbow : POSE_LANDMARKS.rightElbow);
    const shoulder = getPosePoint(side === "left" ? POSE_LANDMARKS.leftShoulder : POSE_LANDMARKS.rightShoulder);
    const state = side2EmissionArmState[side];

    if (!wrist || !shoulder || !center || !state) {
      if (state) {
        state.distance = null;
        state.velocity = 0;
      }
      return;
    }

    const dx = wrist.x - center.x;
    const dy = wrist.y - center.y;
    const distance = Math.hypot(dx, dy);
    const sampleDt = Math.max(0.06, Math.min(0.18, dt));

    if (state.distance === null) {
      state.distance = distance;
      state.velocity = 0;
      return;
    }

    const velocity = (distance - state.distance) / sampleDt;
    const acceleration = (velocity - state.velocity) / sampleDt;
    const velocityThreshold = Math.max(SIDE2_EMISSION_MIN_VELOCITY, bodyScale * 0.42);
    const accelerationThreshold = Math.max(SIDE2_EMISSION_MIN_ACCELERATION, bodyScale * 2.15);
    const cooldown = SIDE2_EMISSION_COOLDOWN_MS * lerp(1.16, 0.78, smoothstep(0.24, 1, progress));

    if (
      velocity > velocityThreshold
      && acceleration > accelerationThreshold
      && now - state.lastEmitAt > cooldown
    ) {
      const force = clamp(
        (velocity - velocityThreshold) / Math.max(1, bodyScale * 1.15)
          + (acceleration - accelerationThreshold) / Math.max(1, bodyScale * 7.4),
        0,
        1
      );
      const qualityCount = side2LensQuality < 0.72 ? 0.58 : 1;
      const count = Math.max(2, Math.round(lerp(3, 8, force) * lerp(0.68, 1, smoothstep(0.18, 1, progress)) * qualityCount));
      spawnOutwardEmissionFragments(side, wrist, elbow || shoulder, center, progress, now, count, force);
      state.lastEmitAt = now;
    }

    state.distance = distance;
    state.velocity = lerp(state.velocity, velocity, 0.58);
  }

  function spawnOutwardEmissionFragments(side, wrist, elbow, center, progress, now, count, force) {
    const directionX = wrist.x - center.x;
    const directionY = wrist.y - center.y;
    const directionLength = Math.max(1, Math.hypot(directionX, directionY));
    const outwardX = directionX / directionLength;
    const outwardY = directionY / directionLength;
    const tangentX = -outwardY;
    const tangentY = outwardX;
    const stagePower = smoothstep(0.16, 1, progress);

    for (let index = 0; index < count; index += 1) {
      const fragment = getAvailableOutwardEmissionFragment(now);
      if (!fragment) return;

      const t = lerp(0.38, 1, Math.random());
      const jitter = lerp(-10, 10, Math.random()) * lerp(0.7, 1.35, force);
      const sourceX = lerp(elbow.x, wrist.x, t) + tangentX * jitter;
      const sourceY = lerp(elbow.y, wrist.y, t) + tangentY * jitter;
      const sourceSize = lerp(12, 26, Math.random()) * lerp(0.82, 1.1, stagePower);
      const speed = lerp(44, 150, Math.random()) * lerp(0.72, 1.24, force) * lerp(0.72, 1, stagePower);
      const sideScatter = lerp(-46, 46, Math.random()) * (0.32 + force * 0.68);

      captureOutwardEmissionFragment(fragment, sourceX, sourceY, sourceSize);

      fragment.active = true;
      fragment.birth = now + index * 4;
      fragment.life = lerp(620, 1450, Math.random()) * lerp(0.86, 1.16, stagePower);
      fragment.x = sourceX + outwardX * lerp(0, 6, Math.random());
      fragment.y = sourceY + outwardY * lerp(0, 6, Math.random());
      fragment.vx = outwardX * speed + tangentX * sideScatter;
      fragment.vy = outwardY * speed + tangentY * sideScatter + lerp(-18, 18, Math.random());
      fragment.size = lerp(5, 15, Math.random()) * lerp(0.82, 1.18, stagePower);
      fragment.aspect = lerp(0.64, 1.65, Math.random());
      fragment.rotation = Math.random() * Math.PI * 2;
      fragment.spin = lerp(-1.8, 1.8, Math.random());
      fragment.alpha = lerp(0.28, 0.62, Math.random()) * lerp(0.72, 1, stagePower);
      fragment.drag = lerp(1.1, 2.4, Math.random());
    }
  }

  function getAvailableOutwardEmissionFragment(now) {
    for (let index = 0; index < side2EmissionFragments.length; index += 1) {
      if (!side2EmissionFragments[index].active) return side2EmissionFragments[index];
    }

    let oldest = null;
    let oldestAge = 0;
    for (let index = 0; index < side2EmissionFragments.length; index += 1) {
      const fragment = side2EmissionFragments[index];
      const age = fragment.life ? (now - fragment.birth) / fragment.life : 0;
      if (age > oldestAge) {
        oldestAge = age;
        oldest = fragment;
      }
    }

    return oldestAge > 0.62 ? oldest : null;
  }

  function captureOutwardEmissionFragment(fragment, x, y, sourceSize) {
    const size = SIDE2_EMISSION_FRAGMENT_CANVAS_SIZE;
    const sx = clamp(Math.round(x - sourceSize * 0.5), 0, Math.max(0, currentCanvas.width - sourceSize));
    const sy = clamp(Math.round(y - sourceSize * 0.5), 0, Math.max(0, currentCanvas.height - sourceSize));
    fragment.ctx.clearRect(0, 0, size, size);
    fragment.ctx.drawImage(currentCanvas, sx, sy, sourceSize, sourceSize, 0, 0, size, size);
  }

  function drawOutwardEmissionFragments(now) {
    if (!side2EmissionFragments.length) return;

    ctx.save();
    ctx.globalCompositeOperation = "source-over";
    ctx.imageSmoothingEnabled = false;

    for (let index = 0; index < side2EmissionFragments.length; index += 1) {
      const fragment = side2EmissionFragments[index];
      if (!fragment.active || now < fragment.birth) continue;

      const life = clamp((now - fragment.birth) / Math.max(1, fragment.life), 0, 1);
      const fade = smoothstep(0, 0.12, life) * (1 - smoothstep(0.48, 1, life));
      if (fade <= 0.002) continue;

      const size = fragment.size * (1 + life * 0.74) * (1 - smoothstep(0.72, 1, life) * 0.34);
      ctx.globalAlpha = fragment.alpha * fade;
      ctx.translate(fragment.x, fragment.y);
      ctx.rotate(fragment.rotation);
      ctx.drawImage(fragment.canvas, -size * 0.5, -size * fragment.aspect * 0.5, size, size * fragment.aspect);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
    }

    ctx.imageSmoothingEnabled = true;
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function getOutwardEmissionBodyCenter() {
    const leftShoulder = getPosePoint(POSE_LANDMARKS.leftShoulder);
    const rightShoulder = getPosePoint(POSE_LANDMARKS.rightShoulder);
    const leftHip = getPosePoint(POSE_LANDMARKS.leftHip);
    const rightHip = getPosePoint(POSE_LANDMARKS.rightHip);
    let x = 0;
    let y = 0;
    let count = 0;

    if (leftShoulder) {
      x += leftShoulder.x;
      y += leftShoulder.y;
      count += 1;
    }
    if (rightShoulder) {
      x += rightShoulder.x;
      y += rightShoulder.y;
      count += 1;
    }
    if (leftHip) {
      x += leftHip.x;
      y += leftHip.y;
      count += 1;
    }
    if (rightHip) {
      x += rightHip.x;
      y += rightHip.y;
      count += 1;
    }

    if (count) return { x: x / count, y: y / count };

    const bounds = stableMaskBounds || currentMaskBounds;
    if (!bounds) return null;
    return {
      x: (bounds.minX + bounds.maxX) * 0.5,
      y: (bounds.minY + bounds.maxY) * 0.5
    };
  }

  function getOutwardEmissionBodyScale() {
    const bounds = stableMaskBounds || currentMaskBounds;
    if (!bounds) return Math.max(120, Math.min(canvas.width || 1, canvas.height || 1) * 0.42);
    return Math.max(120, Math.max(bounds.maxX - bounds.minX, bounds.maxY - bounds.minY));
  }

  function drawOpticalLensSystem(progress, now) {
    const renderStartedAt = window.performance ? performance.now() : now;
    const bounds = getFieldEffectBounds();
    if (!bounds) return;

    const scale = Math.min(
      1,
      (getSide2LensRenderMaxWidth() * side2LensQuality) / Math.max(1, bounds.width),
      (getSide2LensRenderMaxHeight() * side2LensQuality) / Math.max(1, bounds.height)
    );
    const localWidth = Math.max(2, Math.round(bounds.width * scale));
    const localHeight = Math.max(2, Math.round(bounds.height * scale));

    setLensCanvasSize(lensSourceCanvas, lensSourceCtx, localWidth, localHeight);
    setLensCanvasSize(lensLocalMaskCanvas, lensLocalMaskCtx, localWidth, localHeight);
    setLensCanvasSize(lensOutputCanvas, lensOutputCtx, localWidth, localHeight);

    lensSourceCtx.clearRect(0, 0, localWidth, localHeight);
    lensSourceCtx.drawImage(currentCanvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, localWidth, localHeight);

    lensLocalMaskCtx.clearRect(0, 0, localWidth, localHeight);
    lensLocalMaskCtx.drawImage(lensMaskCanvas, bounds.x, bounds.y, bounds.width, bounds.height, 0, 0, localWidth, localHeight);

    const sourcePixels = lensSourceCtx.getImageData(0, 0, localWidth, localHeight);
    const maskPixels = lensLocalMaskCtx.getImageData(0, 0, localWidth, localHeight);
    const outputPixels = getLensOutputPixels(localWidth, localHeight);
    const lenses = side2DrawableLensBuffer;
    const lensCount = getDrawableOpticalLenses(bounds, scale);
    const sourceData = sourcePixels.data;
    const maskData = maskPixels.data;
    const outputData = outputPixels.data;
    const stagePower = lerp(0.22, 1, smoothstep(0.02, 1, progress));

    if (!lensCount || !hasUsableSourcePixels(sourceData)) {
      updateLensPerformance(now, renderStartedAt);
      return;
    }

    const lensBins = buildLensRenderBins(lenses, lensCount, localWidth, localHeight);
    prepareLensPixelLookups(localWidth, localHeight, lensBins);

    for (let y = 0; y < localHeight; y += 1) {
      for (let x = 0; x < localWidth; x += 1) {
        const pixelIndex = (y * localWidth + x) * 4;
        const mask = maskData[pixelIndex] / 255;
        const bodyInfluence = smoothstep(0.004, 0.28, mask);
        let dx = 0;
        let dy = 0;
        let totalWeight = 0;
        let maxAlpha = 0;
        let edgeEnergy = 0;
        let blurWeight = 0;
        let sourceShiftX = 0;
        let sourceShiftY = 0;
        let sourceShiftWeight = 0;
        const binX = side2LensBinXLookup[x];
        const binY = side2LensBinYLookup[y];
        const localLensIndexes = lensBins.cells[binY * lensBins.cols + binX];
        if (!localLensIndexes.length) {
          outputData[pixelIndex + 3] = 0;
          continue;
        }
        let bodyLensAlpha = 0;
        let floatingLensAlpha = 0;

        for (let localLensIndex = 0; localLensIndex < localLensIndexes.length; localLensIndex += 1) {
          const lens = lenses[localLensIndexes[localLensIndex]];
          if (x < lens.minX || x > lens.maxX || y < lens.minY || y > lens.maxY) continue;

          const rx = x - lens.x;
          const ry = y - lens.y;
          const cos = lens.cos;
          const sin = lens.sin;
          const lx = (rx * cos + ry * sin) / lens.radiusX;
          const ly = (-rx * sin + ry * cos) / lens.radiusY;
          const rawDistance = Math.sqrt(lx * lx + ly * ly);
          const polar = Math.atan2(ly, lx);
          const shapeWarp = lens.morphAmount > 0
            ? 1
              + Math.sin(polar * lens.morphSeedA + lens.morphPhase) * lens.morphAmount
              + Math.sin(polar * lens.morphSeedB - lens.morphPhase * 0.72) * lens.morphAmount * 0.56
            : 1;
          let distance = rawDistance / clamp(shapeWarp, 0.62, 1.42);

          if (lens.pixelEdgeAmount > 0.001 && distance > 0.38) {
            const cell = Math.max(1.5, lens.pixelSize);
            const blockX = Math.floor((x + lens.pixelSalt) / cell);
            const blockY = Math.floor((y - lens.pixelSalt * 0.37) / cell);
            const edgeBand = smoothstep(0.46, 1.05, distance);
            const blockNoise = hash2(blockX, blockY, lens.pixelSalt) - 0.5;
            distance += blockNoise * lens.pixelEdgeAmount * edgeBand * 0.18;

            if (edgeBand > 0.5 && hash2(blockX + 17, blockY - 11, lens.pixelSalt + 19) > 0.955 - lens.glitchAmount * 0.18) {
              distance += lens.pixelEdgeAmount * 0.18;
            }
          }

          if (distance >= 1) continue;

          const lensPresence = lens.presence * (lens.fieldAlphaScale || 1);
          const featherStart = clamp(1 - lens.edgeSoftness, 0.54, 0.88);
          const edgeFade = 1 - smoothstep(featherStart, 1, distance);
          const coreStrength = 1 - smoothstep(0.12, featherStart, distance);
          const falloff = Math.pow(edgeFade * (0.66 + coreStrength * 0.34), lens.bubble ? 1.28 : 1.08);
          const center = 1 - smoothstep(0, 1, distance);
          const localMask = lens.floating
            ? Math.max(bodyInfluence * 0.22, falloff * 0.74)
            : Math.max(bodyInfluence * 0.82, falloff * 0.82);
          const influence = falloff * lensPresence * lens.strength * localMask;

          if (influence <= 0.0001) continue;

          const localOffset = getLensLocalOffset(lens, lx, ly, distance, center, influence);
          if (lens.pixelEdgeAmount > 0.001) {
            const edgeBand = smoothstep(0.62, 1, distance);
            const cell = Math.max(1.5, lens.pixelSize);
            const blockX = Math.floor((x + lens.pixelSalt * 0.23) / cell);
            const blockY = Math.floor((y - lens.pixelSalt * 0.19) / cell);
            const scatterA = hash2(blockX, blockY, lens.pixelSalt + 37) - 0.5;
            const scatterB = hash2(blockX - 5, blockY + 13, lens.pixelSalt + 53) - 0.5;
            localOffset.x += scatterA * edgeBand * lens.edgeScatter * lens.pixelEdgeAmount;
            localOffset.y += scatterB * edgeBand * lens.edgeScatter * lens.pixelEdgeAmount;
          }
          dx += (localOffset.x * cos - localOffset.y * sin) * lens.radiusX;
          dy += (localOffset.x * sin + localOffset.y * cos) * lens.radiusY;
          totalWeight += influence;
          maxAlpha = Math.max(maxAlpha, falloff * lensPresence);
          if (lens.floating) {
            floatingLensAlpha = Math.max(floatingLensAlpha, falloff * lensPresence * 0.72);
          } else {
            bodyLensAlpha = Math.max(bodyLensAlpha, falloff * lensPresence);
          }
          edgeEnergy += smoothstep(0.68, 0.98, distance) * falloff * lensPresence;
          blurWeight += influence * lens.blur;

          if (lens.misregister && lens.misPresence > 0.01) {
            const misWeight = influence * lens.misPresence * lens.misAmount * (0.36 + center * 0.64);
            sourceShiftX += (lens.sourceX - lens.x) * misWeight;
            sourceShiftY += (lens.sourceY - lens.y) * misWeight;
            sourceShiftWeight += misWeight;
          }

          if (lens.glitchAmount > 0.01) {
            const glitchWeight = influence * lens.glitchAmount * (0.2 + center * 0.44);
            sourceShiftX += lens.glitchShiftX * glitchWeight;
            sourceShiftY += lens.glitchShiftY * glitchWeight;
            sourceShiftWeight += glitchWeight;
          }
        }

        const organismAlpha = Math.max(bodyLensAlpha, floatingLensAlpha * Math.max(0.34, bodyInfluence));
        const boundsFade = Math.min(side2LensBoundsFadeX[x], side2LensBoundsFadeY[y]);
        const finalAlpha = organismAlpha * boundsFade;

        if (finalAlpha <= 0.002 || maxAlpha <= 0.002 || totalWeight <= 0.0001) {
          outputData[pixelIndex + 3] = 0;
          continue;
        }

        const maxShift = Math.min(localWidth, localHeight) * SIDE2_LENS_MAX_SHIFT * stagePower;
        dx = clamp(dx, -maxShift, maxShift);
        dy = clamp(dy, -maxShift, maxShift);

        if (sourceShiftWeight > 0.0001) {
          const sourceBlend = clamp(sourceShiftWeight * 1.16, 0, SIDE2_LENS_MISREGISTRATION_MAX_BLEND);
          dx += clamp(sourceShiftX / sourceShiftWeight, -localWidth * 0.58, localWidth * 0.58) * sourceBlend;
          dy += clamp(sourceShiftY / sourceShiftWeight, -localHeight * 0.58, localHeight * 0.58) * sourceBlend;
        }

        const sampleX = clamp(x + dx, 0, localWidth - 1);
        const sampleY = clamp(y + dy, 0, localHeight - 1);
        const originalR = sourceData[pixelIndex];
        const originalG = sourceData[pixelIndex + 1];
        const originalB = sourceData[pixelIndex + 2];
        const sampleMix = clamp(0.32 + totalWeight * 0.82, 0, 0.98);
        const contrast = 1 + clamp(edgeEnergy * 0.018, 0, 0.035);
        const edgeLift = clamp(edgeEnergy * 2.2, 0, 1) * 3;

        if (blurWeight > 0.012) {
          writeSoftLensSample(sourceData, localWidth, localHeight, sampleX, sampleY, clamp(blurWeight * 2.6, 0.35, 2.4), outputData, pixelIndex);
        } else {
          writeBilinearSample(sourceData, localWidth, localHeight, sampleX, sampleY, outputData, pixelIndex);
        }
        outputData[pixelIndex] = clamp(lerp(originalR, outputData[pixelIndex], sampleMix) * contrast + edgeLift, 0, 255);
        outputData[pixelIndex + 1] = clamp(lerp(originalG, outputData[pixelIndex + 1], sampleMix) * contrast + edgeLift, 0, 255);
        outputData[pixelIndex + 2] = clamp(lerp(originalB, outputData[pixelIndex + 2], sampleMix) * contrast + edgeLift, 0, 255);
        outputData[pixelIndex + 3] = clamp(finalAlpha * SIDE2_LENS_ALPHA * 255, 0, 255);
      }
    }

    lensOutputCtx.putImageData(outputPixels, 0, 0);

    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(lensOutputCanvas, bounds.x, bounds.y, bounds.width, bounds.height);
    if (SIDE2_LENS_DEBUG) drawLensDebug(lenses, bounds, scale, lensCount);
    ctx.restore();
    updateLensPerformance(now, renderStartedAt);
  }

  function getLensLocalBoundsFade(x, y, width, height) {
    const edge = Math.max(6, Math.min(width, height) * 0.055);
    return Math.min(
      smoothstep(0, edge, x),
      smoothstep(0, edge, y),
      smoothstep(0, edge, width - 1 - x),
      smoothstep(0, edge, height - 1 - y)
    );
  }

  function prepareLensPixelLookups(width, height, bins) {
    if (
      side2LensLookupWidth === width
      && side2LensLookupHeight === height
      && side2LensLookupBinSize === bins.binSize
    ) {
      return;
    }

    side2LensLookupWidth = width;
    side2LensLookupHeight = height;
    side2LensLookupBinSize = bins.binSize;
    side2LensBinXLookup.length = width;
    side2LensBinYLookup.length = height;
    side2LensBoundsFadeX.length = width;
    side2LensBoundsFadeY.length = height;

    const edge = Math.max(6, Math.min(width, height) * 0.055);

    for (let x = 0; x < width; x += 1) {
      side2LensBinXLookup[x] = Math.min(bins.cols - 1, Math.max(0, Math.floor(x / bins.binSize)));
      side2LensBoundsFadeX[x] = Math.min(
        smoothstep(0, edge, x),
        smoothstep(0, edge, width - 1 - x)
      );
    }

    for (let y = 0; y < height; y += 1) {
      side2LensBinYLookup[y] = Math.min(bins.rows - 1, Math.max(0, Math.floor(y / bins.binSize)));
      side2LensBoundsFadeY[y] = Math.min(
        smoothstep(0, edge, y),
        smoothstep(0, edge, height - 1 - y)
      );
    }
  }

  function getLensOutputPixels(width, height) {
    if (!side2LensOutputPixels || side2LensOutputWidth !== width || side2LensOutputHeight !== height) {
      side2LensOutputPixels = lensOutputCtx.createImageData(width, height);
      side2LensOutputWidth = width;
      side2LensOutputHeight = height;
    }

    return side2LensOutputPixels;
  }

  function getLensLocalOffset(lens, lx, ly, distance, center, influence) {
    let sampleX = lx;
    let sampleY = ly;
    const amount = clamp(influence, 0, lens.bubble ? 0.68 : 0.84);

    if (lens.type === 0) {
      const magnify = 1 - amount * (0.52 + center * 0.44);
      sampleX *= magnify;
      sampleY *= magnify;
    } else if (lens.type === 1) {
      const compress = 1 + amount * (0.62 + center * 0.42);
      sampleX *= compress;
      sampleY *= compress;
    } else if (lens.type === 2) {
      const angle = lens.twist * amount * (0.52 + center * 1.18);
      const ca = Math.cos(angle);
      const sa = Math.sin(angle);
      sampleX = lx * ca - ly * sa;
      sampleY = lx * sa + ly * ca;
    } else if (lens.type === 3) {
      sampleX *= 1 - amount * 0.52;
      sampleY *= 1 + amount * 0.36;
    } else if (lens.type === 4) {
      const pinch = 1 + amount * (distance < 0.5 ? 0.48 : -0.38);
      sampleX *= pinch;
      sampleY *= pinch;
    } else if (lens.type === 6) {
      sampleX *= 1 + amount * 0.52;
      sampleY *= 1 - amount * 0.24;
    } else if (lens.type === 7) {
      sampleX *= 1 - amount * 0.24;
      sampleY *= 1 + amount * 0.52;
    } else {
      const bulge = 1 - amount * (0.76 - distance * 0.34);
      sampleX *= bulge;
      sampleY *= bulge;
    }

    return {
      x: sampleX - lx,
      y: sampleY - ly
    };
  }

  function getDrawableOpticalLenses(bounds, scale) {
    side2DrawableLensCount = 0;
    const simplifyFloating = side2LensQuality < 0.72;
    const simplifyTinyBody = side2LensQuality < 0.56;

    for (let index = 0; index < side2Lenses.length; index += 1) {
      const lens = side2Lenses[index];
      if (lens.presence <= 0.01 || lens.radius <= 1) continue;
      const scaledRadius = lens.radius * scale;
      if (simplifyFloating && lens.floating && (lens.presence < 0.18 || scaledRadius < 4.4)) continue;
      if (simplifyTinyBody && !lens.floating && lens.presence < 0.26 && scaledRadius < 3.2) continue;

      pushDrawableLens(side2DrawableLensBuffer, lens, bounds, scale, getBaseLensEdgeSoftness(lens));
    }

    for (let index = 0; index < side2LensBubbles.length; index += 1) {
      const bubble = side2LensBubbles[index];
      if (bubble.presence <= 0.01 || bubble.radius <= 1 || bubble.strength <= 0.001) continue;
      if (simplifyFloating && (bubble.presence < 0.22 || bubble.radius * scale < 4.8)) continue;
      pushDrawableLens(side2DrawableLensBuffer, bubble, bounds, scale, bubble.edgeSoftness || SIDE2_LENS_BUBBLE_EDGE_SOFTNESS);
    }

    return side2DrawableLensCount;
  }

  function buildLensRenderBins(lenses, lensCount, width, height) {
    const binSize = SIDE2_LENS_RENDER_BIN_SIZE;
    const cols = Math.max(1, Math.ceil(width / binSize));
    const rows = Math.max(1, Math.ceil(height / binSize));
    const totalCells = cols * rows;
    const bins = side2LensRenderBins;

    if (
      bins.cols !== cols
      || bins.rows !== rows
      || bins.binSize !== binSize
      || bins.cells.length !== totalCells
    ) {
      bins.cols = cols;
      bins.rows = rows;
      bins.binSize = binSize;
      bins.cells = new Array(totalCells);

      for (let index = 0; index < totalCells; index += 1) {
        bins.cells[index] = [];
      }
    } else {
      for (let index = 0; index < bins.cells.length; index += 1) {
        bins.cells[index].length = 0;
      }
    }

    for (let lensIndex = 0; lensIndex < lensCount; lensIndex += 1) {
      const lens = lenses[lensIndex];
      const minX = clamp(Math.floor(lens.minX / binSize), 0, cols - 1);
      const maxX = clamp(Math.floor(lens.maxX / binSize), 0, cols - 1);
      const minY = clamp(Math.floor(lens.minY / binSize), 0, rows - 1);
      const maxY = clamp(Math.floor(lens.maxY / binSize), 0, rows - 1);

      for (let y = minY; y <= maxY; y += 1) {
        for (let x = minX; x <= maxX; x += 1) {
          bins.cells[y * cols + x].push(lensIndex);
        }
      }
    }

    return bins;
  }

  function pushDrawableLens(output, lens, bounds, scale, edgeSoftness) {
    const radius = lens.radius * scale;
    let radiusX = Math.max(SIDE2_LENS_MIN_DRAW_RADIUS, radius * Math.max(0.52, lens.aspect || 1));
    let radiusY = Math.max(SIDE2_LENS_MIN_DRAW_RADIUS, radius / Math.max(0.58, Math.sqrt(lens.aspect || 1)));
    if (lens.glitchAmount > 0.03) {
      const strip = hash2((lens.name || "").length, lens.type || 0, lens.pixelSalt || 0) > 0.5 ? 1 : -1;
      radiusX *= 1 + Math.max(0, strip) * lens.glitchAmount * 1.25;
      radiusY *= 1 + Math.max(0, -strip) * lens.glitchAmount * 1.25;
      radiusX *= 1 - Math.max(0, -strip) * lens.glitchAmount * 0.44;
      radiusY *= 1 - Math.max(0, strip) * lens.glitchAmount * 0.44;
    }
    const localX = (lens.x - bounds.x) * scale;
    const localY = (lens.y - bounds.y) * scale;
    const sourceX = Number.isFinite(lens.misX) ? (lens.misX - bounds.x) * scale : localX;
    const sourceY = Number.isFinite(lens.misY) ? (lens.misY - bounds.y) * scale : localY;
    const maxRadius = Math.max(radiusX, radiusY);
    const finalEdgeSoftness = getLensEdgeSoftness(lens, maxRadius, edgeSoftness);
    const orientation = lens.orientation || 0;
    const minX = localX - maxRadius;
    const maxX = localX + maxRadius;
    const minY = localY - maxRadius;
    const maxY = localY + maxRadius;

    if (maxX < 0 || minX > bounds.width * scale || maxY < 0 || minY > bounds.height * scale) return;

    const item = output[side2DrawableLensCount] || (output[side2DrawableLensCount] = {});
    side2DrawableLensCount += 1;

    item.x = localX;
    item.y = localY;
    item.radiusX = radiusX;
    item.radiusY = radiusY;
    item.minX = minX;
    item.maxX = maxX;
    item.minY = minY;
    item.maxY = maxY;
    item.type = lens.type;
    item.edgeSoftness = finalEdgeSoftness;
    item.orientation = orientation;
    item.cos = Math.cos(orientation);
    item.sin = Math.sin(orientation);
    item.strength = lens.strength;
    item.twist = lens.twist;
    item.presence = lens.presence;
    item.fieldAlphaScale = lens.fieldAlphaScale || 1;
    item.blur = lens.blur || 0;
    item.floating = lens.floating;
    item.bubble = Boolean(lens.bubble);
    item.misregister = Boolean(lens.misregister && lens.misPresence > 0.01);
    item.misPresence = lens.misPresence || 0;
    item.misAmount = lens.misBaseAmount || 0;
    item.sourceX = sourceX;
    item.sourceY = sourceY;
    item.glitchAmount = lens.glitchAmount || 0;
    item.glitchShiftX = (lens.glitchSampleShiftX || 0) * scale;
    item.glitchShiftY = (lens.glitchSampleShiftY || 0) * scale;
    item.morphAmount = lens.morphAmount || 0;
    item.morphPhase = lens.morphPhase || ((lens.phase || 0) + (lens.orientation || 0) * 0.7);
    item.morphSeedA = lens.morphSeedA || 2.4;
    item.morphSeedB = lens.morphSeedB || 4.2;
    item.pixelEdgeAmount = lens.pixelEdgeAmount || 0;
    item.pixelSize = (lens.pixelSize || 4) * (lens.bubble ? 0.8 : 1);
    item.pixelSalt = lens.pixelSalt || 0;
    item.edgeScatter = lens.edgeScatter || 0;
    item.name = lens.name;
  }

  function getBaseLensEdgeSoftness(lens) {
    if (lens.bubble) return SIDE2_LENS_BUBBLE_EDGE_SOFTNESS;
    if (lens.floating) return SIDE2_LENS_FLOATING_EDGE_SOFTNESS;
    return SIDE2_LENS_EDGE_SOFTNESS;
  }

  function getLensEdgeSoftness(lens, radius, baseSoftness) {
    const variation = (hash2((lens.name || "").length, lens.type || 0, 451) - 0.5) * 0.055;
    let softness = baseSoftness + variation;

    if (lens.bubble) {
      softness += radius < 20 ? 0.1 : 0.045;
    } else if (lens.floating) {
      softness += radius < 24 ? 0.085 : 0.04;
    } else if (radius > 54) {
      softness += 0.055;
    }

    return clamp(softness, lens.bubble ? 0.36 : 0.24, lens.bubble ? 0.56 : 0.48);
  }

  function updateLensPerformance(now, renderStartedAt) {
    const renderEndedAt = window.performance ? performance.now() : now;
    side2MeasuredLensMs = lerp(side2MeasuredLensMs, Math.max(0, renderEndedAt - renderStartedAt), side2MeasuredLensMs ? 0.08 : 1);
    side2LensPerfFrameCount += 1;

    if (!side2LensPerfWindowStartedAt) {
      side2LensPerfWindowStartedAt = now;
      return;
    }

    const elapsed = now - side2LensPerfWindowStartedAt;
    if (elapsed < SIDE2_LENS_PERF_SAMPLE_INTERVAL) return;

    side2MeasuredLensFps = (side2LensPerfFrameCount * 1000) / Math.max(1, elapsed);

    if (side2MeasuredLensFps < SIDE2_LENS_LOW_FPS_THRESHOLD || side2MeasuredLensMs > 13) {
      side2LensQuality = Math.max(getSide2MinLensQuality(), side2LensQuality - (side2MeasuredLensMs > 20 ? 0.1 : 0.065));
    } else if (side2MeasuredLensFps > SIDE2_LENS_HIGH_FPS_THRESHOLD && side2MeasuredLensMs < 8.5) {
      side2LensQuality = Math.min(0.94, side2LensQuality + 0.025);
    }

    side2LensPerfFrameCount = 0;
    side2LensPerfWindowStartedAt = now;
  }

  function drawLensDebug(lenses, bounds, scale, lensCount) {
    ctx.save();
    ctx.lineWidth = 1;
    ctx.strokeStyle = "rgba(255,255,255,0.58)";
    ctx.fillStyle = "rgba(255,255,255,0.72)";
    ctx.font = "10px sans-serif";

    for (let index = 0; index < lensCount; index += 1) {
      const lens = lenses[index];
      const x = bounds.x + lens.x / scale;
      const y = bounds.y + lens.y / scale;
      const radiusX = lens.radiusX / scale;
      const radiusY = lens.radiusY / scale;

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(lens.orientation);
      ctx.beginPath();
      ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      ctx.fillRect(x - 1.5, y - 1.5, 3, 3);
      ctx.fillText((index + 1) + " " + lens.name, x + 4, y - 4);
    }

    ctx.fillText("FPS " + side2MeasuredLensFps.toFixed(1), 12, 18);
    ctx.fillText("Lenses " + lensCount, 12, 32);
    ctx.fillText("Stage " + getStage(latestProgress), 12, 46);
    ctx.restore();
  }

  function getSide2LensCount(progress) {
    if (progress < 0.2) return Math.round(lerp(32, SIDE2_LENS_STAGE_COUNTS[1], smoothstep(0, 0.2, progress)));
    if (progress < 0.4) return Math.round(lerp(SIDE2_LENS_STAGE_COUNTS[1], SIDE2_LENS_STAGE_COUNTS[2], smoothstep(0.2, 0.4, progress)));
    if (progress < 0.6) return Math.round(lerp(SIDE2_LENS_STAGE_COUNTS[2], SIDE2_LENS_STAGE_COUNTS[3], smoothstep(0.4, 0.6, progress)));
    if (progress < 0.82) return Math.round(lerp(SIDE2_LENS_STAGE_COUNTS[3], SIDE2_LENS_STAGE_COUNTS[4], smoothstep(0.6, 0.82, progress)));
    return Math.round(lerp(SIDE2_LENS_STAGE_COUNTS[4], SIDE2_LENS_STAGE_COUNTS[5], smoothstep(0.82, 1, progress)));
  }

  function getSide2LensGuides() {
    if (side2LensGuideCache) return side2LensGuideCache;

    const bodyGuides = [
      { name: "left-eye", u: 0.46, v: 0.25, radius: 0.044, aspect: 1.18, strength: 1.58, twist: 0.19, type: 0, points: [POSE_LANDMARKS.leftEye] },
      { name: "mouth", u: 0.5, v: 0.34, radius: 0.043, aspect: 1.28, strength: 1.48, twist: -0.14, type: 4, points: [POSE_LANDMARKS.leftMouth, POSE_LANDMARKS.rightMouth] },
      { name: "chest", u: 0.5, v: 0.47, radius: 0.075, aspect: 1.22, strength: 0.84, twist: 0.1, type: 1, points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder] },
      { name: "left-hand", u: 0.25, v: 0.56, radius: 0.052, aspect: 1.22, strength: 1.66, twist: 0.26, type: 2, points: [POSE_LANDMARKS.leftWrist], offsetU: -0.018, offsetV: 0.01 },
      { name: "right-hand", u: 0.75, v: 0.56, radius: 0.04, aspect: 0.94, strength: 1.48, twist: -0.18, type: 2, points: [POSE_LANDMARKS.rightWrist], offsetU: 0.018, offsetV: 0.01 },
      { name: "right-eye", u: 0.54, v: 0.25, radius: 0.034, aspect: 0.92, strength: 1.48, twist: -0.17, type: 5, points: [POSE_LANDMARKS.rightEye] },
      { name: "nose-bridge", u: 0.5, v: 0.285, radius: 0.032, aspect: 0.92, strength: 1.5, twist: 0.12, type: 1, points: [POSE_LANDMARKS.nose], offsetV: 0.018 },
      { name: "left-shoulder", u: 0.41, v: 0.41, radius: 0.066, aspect: 1.34, strength: 1.08, twist: 0.09, type: 3, points: [POSE_LANDMARKS.leftShoulder] },
      { name: "right-shoulder", u: 0.59, v: 0.41, radius: 0.048, aspect: 1.02, strength: 0.88, twist: -0.06, type: 3, points: [POSE_LANDMARKS.rightShoulder] },
      { name: "left-hip", u: 0.42, v: 0.62, radius: 0.058, aspect: 1.04, strength: 0.92, twist: -0.1, type: 5, points: [POSE_LANDMARKS.leftHip] },
      { name: "right-hip", u: 0.58, v: 0.62, radius: 0.058, aspect: 1.04, strength: 0.92, twist: 0.1, type: 0, points: [POSE_LANDMARKS.rightHip] },
      { name: "left-forearm", u: 0.29, v: 0.52, radius: 0.05, aspect: 1.65, strength: 1.18, twist: 0.14, type: 3, from: POSE_LANDMARKS.leftElbow, to: POSE_LANDMARKS.leftWrist, t: 0.58 },
      { name: "right-forearm", u: 0.71, v: 0.52, radius: 0.05, aspect: 1.65, strength: 1.18, twist: -0.14, type: 3, from: POSE_LANDMARKS.rightElbow, to: POSE_LANDMARKS.rightWrist, t: 0.58 },
      { name: "left-knee", u: 0.38, v: 0.8, radius: 0.046, aspect: 0.96, strength: 1.18, twist: 0.18, type: 4, points: [POSE_LANDMARKS.leftKnee] },
      { name: "right-knee", u: 0.62, v: 0.8, radius: 0.046, aspect: 0.96, strength: 1.18, twist: -0.18, type: 4, points: [POSE_LANDMARKS.rightKnee] },
      { name: "left-foot", u: 0.36, v: 0.97, radius: 0.04, aspect: 1.32, strength: 1.25, twist: 0.12, type: 1, points: [POSE_LANDMARKS.leftAnkle], offsetU: -0.016, offsetV: 0.03 },
      { name: "right-foot", u: 0.64, v: 0.97, radius: 0.04, aspect: 1.32, strength: 1.25, twist: -0.12, type: 1, points: [POSE_LANDMARKS.rightAnkle], offsetU: 0.016, offsetV: 0.03 },
      { name: "left-upper-arm", u: 0.35, v: 0.45, radius: 0.052, aspect: 1.5, strength: 1.08, twist: 0.1, type: 2, from: POSE_LANDMARKS.leftShoulder, to: POSE_LANDMARKS.leftElbow, t: 0.55 },
      { name: "right-upper-arm", u: 0.65, v: 0.45, radius: 0.052, aspect: 1.5, strength: 1.08, twist: -0.1, type: 2, from: POSE_LANDMARKS.rightShoulder, to: POSE_LANDMARKS.rightElbow, t: 0.55 },
      { name: "left-thigh", u: 0.4, v: 0.71, radius: 0.056, aspect: 1.55, strength: 1.04, twist: -0.12, type: 0, from: POSE_LANDMARKS.leftHip, to: POSE_LANDMARKS.leftKnee, t: 0.58 },
      { name: "right-thigh", u: 0.6, v: 0.71, radius: 0.056, aspect: 1.55, strength: 1.04, twist: 0.12, type: 5, from: POSE_LANDMARKS.rightHip, to: POSE_LANDMARKS.rightKnee, t: 0.58 },
      { name: "forehead", u: 0.5, v: 0.2, radius: 0.04, aspect: 1.08, strength: 1.34, twist: 0.12, type: 1, points: [POSE_LANDMARKS.nose], offsetV: -0.08 },
      { name: "left-cheek", u: 0.45, v: 0.3, radius: 0.036, aspect: 1, strength: 1.38, twist: -0.14, type: 2, points: [POSE_LANDMARKS.leftEye, POSE_LANDMARKS.leftMouth] },
      { name: "right-cheek", u: 0.55, v: 0.3, radius: 0.036, aspect: 1, strength: 1.38, twist: 0.14, type: 2, points: [POSE_LANDMARKS.rightEye, POSE_LANDMARKS.rightMouth] },
      { name: "jaw", u: 0.5, v: 0.37, radius: 0.038, aspect: 1.22, strength: 1.32, twist: 0.1, type: 3, points: [POSE_LANDMARKS.leftMouth, POSE_LANDMARKS.rightMouth], offsetV: 0.035 },
      { name: "left-elbow", u: 0.32, v: 0.48, radius: 0.042, aspect: 1.06, strength: 1.32, twist: 0.18, type: 5, points: [POSE_LANDMARKS.leftElbow] },
      { name: "right-elbow", u: 0.68, v: 0.48, radius: 0.042, aspect: 1.06, strength: 1.32, twist: -0.18, type: 5, points: [POSE_LANDMARKS.rightElbow] },
      { name: "left-calf", u: 0.36, v: 0.89, radius: 0.044, aspect: 1.6, strength: 1.08, twist: 0.12, type: 0, from: POSE_LANDMARKS.leftKnee, to: POSE_LANDMARKS.leftAnkle, t: 0.62 },
      { name: "right-calf", u: 0.64, v: 0.89, radius: 0.044, aspect: 1.6, strength: 1.08, twist: -0.12, type: 0, from: POSE_LANDMARKS.rightKnee, to: POSE_LANDMARKS.rightAnkle, t: 0.62 },
      { name: "neck-soft", u: 0.5, v: 0.39, radius: 0.046, aspect: 0.96, strength: 1.05, twist: 0.08, type: 7, blur: 0.18, points: [POSE_LANDMARKS.nose, POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder] },
      { name: "abdomen-small", u: 0.5, v: 0.57, radius: 0.048, aspect: 1.18, strength: 0.95, twist: -0.08, type: 4, points: [POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightShoulder] },
      { name: "crown-offset", u: 0.48, v: 0.13, radius: 0.035, aspect: 1.16, strength: 1.18, twist: 0.13, type: 0, points: [POSE_LANDMARKS.nose], offsetU: -0.018, offsetV: -0.15 },
      { name: "crown-tiny-right", u: 0.56, v: 0.14, radius: 0.021, aspect: 0.86, strength: 1.08, twist: -0.09, type: 4, points: [POSE_LANDMARKS.nose], offsetU: 0.055, offsetV: -0.135 },
      { name: "hairline-left-cluster", u: 0.43, v: 0.17, radius: 0.028, aspect: 1.35, strength: 1.26, twist: 0.18, type: 2, points: [POSE_LANDMARKS.leftEye], offsetU: -0.038, offsetV: -0.082 },
      { name: "hairline-right-thread", u: 0.57, v: 0.18, radius: 0.019, aspect: 1.72, strength: 1.12, twist: -0.12, type: 6, points: [POSE_LANDMARKS.rightEye], offsetU: 0.026, offsetV: -0.095 },
      { name: "left-temple-deep", u: 0.39, v: 0.24, radius: 0.041, aspect: 1.2, strength: 1.34, twist: -0.17, type: 5, points: [POSE_LANDMARKS.leftEye], offsetU: -0.055, offsetV: -0.008 },
      { name: "right-temple-pin", u: 0.61, v: 0.235, radius: 0.024, aspect: 0.82, strength: 1.18, twist: 0.11, type: 4, points: [POSE_LANDMARKS.rightEye], offsetU: 0.04, offsetV: -0.014 },
      { name: "left-cheek-lower", u: 0.43, v: 0.335, radius: 0.031, aspect: 1.42, strength: 1.32, twist: 0.12, type: 3, points: [POSE_LANDMARKS.leftEye, POSE_LANDMARKS.leftMouth], offsetU: -0.02, offsetV: 0.028 },
      { name: "left-cheek-pin", u: 0.47, v: 0.29, radius: 0.018, aspect: 0.9, strength: 1.22, twist: -0.2, type: 4, points: [POSE_LANDMARKS.leftEye, POSE_LANDMARKS.leftMouth], offsetU: 0.012, offsetV: -0.018 },
      { name: "right-cheek-wide", u: 0.57, v: 0.31, radius: 0.047, aspect: 1.28, strength: 1.36, twist: 0.16, type: 0, points: [POSE_LANDMARKS.rightEye, POSE_LANDMARKS.rightMouth], offsetU: 0.022, offsetV: 0.012 },
      { name: "right-cheek-micro", u: 0.61, v: 0.34, radius: 0.017, aspect: 1.1, strength: 1.15, twist: -0.1, type: 7, points: [POSE_LANDMARKS.rightEye, POSE_LANDMARKS.rightMouth], offsetU: 0.052, offsetV: 0.04 },
      { name: "mouth-upper-left", u: 0.47, v: 0.325, radius: 0.023, aspect: 1.56, strength: 1.25, twist: 0.09, type: 6, points: [POSE_LANDMARKS.leftMouth, POSE_LANDMARKS.rightMouth], offsetU: -0.034, offsetV: -0.018 },
      { name: "left-jaw-hinge", u: 0.42, v: 0.38, radius: 0.034, aspect: 1.06, strength: 1.3, twist: -0.16, type: 5, points: [POSE_LANDMARKS.leftMouth], offsetU: -0.054, offsetV: 0.055 },
      { name: "right-jaw-pin", u: 0.59, v: 0.37, radius: 0.022, aspect: 1.28, strength: 1.16, twist: 0.14, type: 1, points: [POSE_LANDMARKS.rightMouth], offsetU: 0.034, offsetV: 0.038 },
      { name: "left-neck-river", u: 0.46, v: 0.405, radius: 0.03, aspect: 1.85, strength: 1.14, twist: 0.08, type: 7, points: [POSE_LANDMARKS.nose, POSE_LANDMARKS.leftShoulder], offsetU: -0.018, offsetV: 0.045 },
      { name: "right-throat-small", u: 0.54, v: 0.41, radius: 0.022, aspect: 0.86, strength: 1.08, twist: -0.09, type: 4, points: [POSE_LANDMARKS.nose, POSE_LANDMARKS.rightShoulder], offsetU: 0.026, offsetV: 0.052 },
      { name: "left-wrist-tiny", u: 0.26, v: 0.53, radius: 0.028, aspect: 0.94, strength: 1.55, twist: 0.18, type: 0, points: [POSE_LANDMARKS.leftWrist], offsetU: -0.025 },
      { name: "right-wrist-tiny", u: 0.74, v: 0.53, radius: 0.028, aspect: 0.94, strength: 1.55, twist: -0.18, type: 0, points: [POSE_LANDMARKS.rightWrist], offsetU: 0.025 },
      { name: "left-palm-broad", u: 0.23, v: 0.57, radius: 0.034, aspect: 1.18, strength: 1.46, twist: 0.2, type: 5, points: [POSE_LANDMARKS.leftWrist], offsetU: -0.045, offsetV: 0.034 },
      { name: "left-thumb-knuckle", u: 0.205, v: 0.555, radius: 0.016, aspect: 0.72, strength: 1.22, twist: -0.13, type: 4, points: [POSE_LANDMARKS.leftWrist], offsetU: -0.085, offsetV: -0.01 },
      { name: "left-index-finger", u: 0.218, v: 0.515, radius: 0.018, aspect: 1.52, strength: 1.3, twist: 0.11, type: 6, points: [POSE_LANDMARKS.leftWrist], offsetU: -0.072, offsetV: -0.055 },
      { name: "left-ring-finger", u: 0.257, v: 0.6, radius: 0.014, aspect: 1.76, strength: 1.18, twist: 0.2, type: 7, points: [POSE_LANDMARKS.leftWrist], offsetU: -0.03, offsetV: 0.084 },
      { name: "right-palm-pin", u: 0.76, v: 0.56, radius: 0.021, aspect: 0.86, strength: 1.34, twist: -0.2, type: 4, points: [POSE_LANDMARKS.rightWrist], offsetU: 0.052, offsetV: 0.024 },
      { name: "right-finger-line", u: 0.8, v: 0.53, radius: 0.017, aspect: 1.82, strength: 1.26, twist: -0.12, type: 6, points: [POSE_LANDMARKS.rightWrist], offsetU: 0.09, offsetV: -0.038 },
      { name: "right-little-knuckle", u: 0.735, v: 0.605, radius: 0.014, aspect: 0.78, strength: 1.16, twist: 0.16, type: 5, points: [POSE_LANDMARKS.rightWrist], offsetU: 0.028, offsetV: 0.086 },
      { name: "left-elbow-micro-a", u: 0.31, v: 0.465, radius: 0.02, aspect: 1.22, strength: 1.2, twist: -0.18, type: 2, points: [POSE_LANDMARKS.leftElbow], offsetU: -0.032, offsetV: -0.026 },
      { name: "left-elbow-micro-b", u: 0.335, v: 0.505, radius: 0.017, aspect: 0.9, strength: 1.14, twist: 0.15, type: 4, points: [POSE_LANDMARKS.leftElbow], offsetU: 0.02, offsetV: 0.045 },
      { name: "right-elbow-slice", u: 0.69, v: 0.49, radius: 0.029, aspect: 1.68, strength: 1.22, twist: -0.1, type: 3, points: [POSE_LANDMARKS.rightElbow], offsetU: 0.042, offsetV: 0.01 },
      { name: "front-neck-small", u: 0.5, v: 0.395, radius: 0.02, aspect: 0.82, strength: 1.18, twist: 0.12, type: 0, points: [POSE_LANDMARKS.nose, POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder], offsetV: 0.058 },
      { name: "back-neck-shadow", u: 0.47, v: 0.375, radius: 0.026, aspect: 1.4, strength: 1.08, twist: -0.08, type: 1, points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder], offsetU: -0.028, offsetV: -0.025 },
      { name: "side-neck-left-pin", u: 0.435, v: 0.392, radius: 0.018, aspect: 0.92, strength: 1.16, twist: -0.12, type: 4, points: [POSE_LANDMARKS.nose, POSE_LANDMARKS.leftShoulder], offsetU: -0.055, offsetV: 0.025 },
      { name: "side-neck-right-long", u: 0.565, v: 0.39, radius: 0.031, aspect: 1.72, strength: 1.12, twist: 0.08, type: 7, points: [POSE_LANDMARKS.nose, POSE_LANDMARKS.rightShoulder], offsetU: 0.058, offsetV: 0.018 },
      { name: "forehead-left-tiny", u: 0.46, v: 0.205, radius: 0.018, aspect: 0.74, strength: 1.14, twist: 0.18, type: 5, points: [POSE_LANDMARKS.nose], offsetU: -0.054, offsetV: -0.072 },
      { name: "forehead-right-oval", u: 0.55, v: 0.19, radius: 0.029, aspect: 1.44, strength: 1.22, twist: -0.08, type: 3, points: [POSE_LANDMARKS.nose], offsetU: 0.045, offsetV: -0.088 },
      { name: "top-head-micro-left", u: 0.44, v: 0.105, radius: 0.015, aspect: 1.08, strength: 1.08, twist: 0.12, type: 4, points: [POSE_LANDMARKS.nose], offsetU: -0.064, offsetV: -0.18 },
      { name: "top-head-wide-right", u: 0.58, v: 0.108, radius: 0.038, aspect: 1.3, strength: 1.16, twist: -0.1, type: 1, points: [POSE_LANDMARKS.nose], offsetU: 0.078, offsetV: -0.172 },
      { name: "jaw-under-left", u: 0.46, v: 0.397, radius: 0.019, aspect: 1.24, strength: 1.13, twist: 0.14, type: 6, points: [POSE_LANDMARKS.leftMouth], offsetU: -0.028, offsetV: 0.075 },
      { name: "right-cheek-knuckle-source", u: 0.585, v: 0.285, radius: 0.019, aspect: 0.9, strength: 1.24, twist: -0.18, type: 4, points: [POSE_LANDMARKS.rightEye, POSE_LANDMARKS.rightMouth], offsetU: 0.045, offsetV: -0.02 }
    ];

    const floatingGuides = [
      { name: "float-left-shoulder", floating: true, u: 0.28, v: 0.34, radius: 0.03, aspect: 1.08, strength: 0.62, twist: 0.1, type: 0, floatRangeX: 0.1, floatRangeY: 0.07, floatWander: 0.035, floatSpeed: 0.00012 },
      { name: "float-right-face", floating: true, u: 0.68, v: 0.26, radius: 0.024, aspect: 0.9, strength: 0.72, twist: -0.14, type: 2, blur: 0.16, floatRangeX: 0.12, floatRangeY: 0.08, floatWander: 0.04, floatSpeed: 0.0001 },
      { name: "float-left-hand", floating: true, u: 0.18, v: 0.55, radius: 0.026, aspect: 1.24, strength: 0.68, twist: 0.16, type: 3, floatRangeX: 0.14, floatRangeY: 0.08, floatWander: 0.055, floatSpeed: 0.00011 },
      { name: "float-right-hand", floating: true, u: 0.82, v: 0.56, radius: 0.026, aspect: 1.24, strength: 0.68, twist: -0.16, type: 3, floatRangeX: 0.14, floatRangeY: 0.08, floatWander: 0.055, floatSpeed: 0.000095 },
      { name: "float-chest-large", floating: true, u: 0.5, v: 0.49, radius: 0.082, aspect: 1.1, strength: 0.42, twist: 0.06, type: 5, blur: 0.2, floatRangeX: 0.08, floatRangeY: 0.04, floatWander: 0.035, floatSpeed: 0.00007 },
      { name: "float-left-knee", floating: true, u: 0.28, v: 0.78, radius: 0.032, aspect: 1.0, strength: 0.74, twist: 0.16, type: 4, floatRangeX: 0.12, floatRangeY: 0.09, floatWander: 0.045, floatSpeed: 0.000105 },
      { name: "float-right-knee", floating: true, u: 0.72, v: 0.78, radius: 0.032, aspect: 1.0, strength: 0.74, twist: -0.16, type: 4, floatRangeX: 0.12, floatRangeY: 0.09, floatWander: 0.045, floatSpeed: 0.00009 },
      { name: "float-low-left", floating: true, u: 0.32, v: 1.02, radius: 0.022, aspect: 0.88, strength: 0.7, twist: 0.14, type: 1, floatRangeX: 0.12, floatRangeY: 0.06, floatWander: 0.05, floatSpeed: 0.00012 },
      { name: "float-low-right", floating: true, u: 0.68, v: 1.02, radius: 0.022, aspect: 0.88, strength: 0.7, twist: -0.14, type: 1, floatRangeX: 0.12, floatRangeY: 0.06, floatWander: 0.05, floatSpeed: 0.0001 },
      { name: "float-above-head", floating: true, u: 0.5, v: 0.08, radius: 0.036, aspect: 1.16, strength: 0.56, twist: 0.1, type: 0, blur: 0.15, floatRangeX: 0.1, floatRangeY: 0.06, floatWander: 0.038, floatSpeed: 0.00008 },
      { name: "float-left-space", floating: true, u: 0.08, v: 0.42, radius: 0.028, aspect: 1.38, strength: 0.52, twist: 0.12, type: 6, floatRangeX: 0.08, floatRangeY: 0.18, floatWander: 0.055, floatSpeed: 0.000105 },
      { name: "float-right-space", floating: true, u: 0.92, v: 0.44, radius: 0.028, aspect: 1.38, strength: 0.52, twist: -0.12, type: 7, floatRangeX: 0.08, floatRangeY: 0.18, floatWander: 0.055, floatSpeed: 0.0001 },
      { name: "float-small-a", floating: true, u: 0.37, v: 0.31, radius: 0.019, aspect: 0.82, strength: 0.72, twist: 0.18, type: 2, floatRangeX: 0.16, floatRangeY: 0.09, floatWander: 0.06, floatSpeed: 0.00012 },
      { name: "float-small-b", floating: true, u: 0.63, v: 0.66, radius: 0.019, aspect: 0.82, strength: 0.72, twist: -0.18, type: 2, floatRangeX: 0.16, floatRangeY: 0.09, floatWander: 0.06, floatSpeed: 0.000115 },
      { name: "float-soft-left", floating: true, u: 0.24, v: 0.68, radius: 0.052, aspect: 1.04, strength: 0.44, twist: 0.08, type: 5, blur: 0.24, floatRangeX: 0.1, floatRangeY: 0.11, floatWander: 0.04, floatSpeed: 0.000075 },
      { name: "float-soft-right", floating: true, u: 0.76, v: 0.68, radius: 0.052, aspect: 1.04, strength: 0.44, twist: -0.08, type: 5, blur: 0.24, floatRangeX: 0.1, floatRangeY: 0.11, floatWander: 0.04, floatSpeed: 0.00008 },
      { name: "float-wide-left", floating: true, u: 0.18, v: 0.86, radius: 0.07, aspect: 1.28, strength: 0.38, twist: 0.05, type: 0, floatRangeX: 0.09, floatRangeY: 0.1, floatWander: 0.035, floatSpeed: 0.00006 },
      { name: "float-wide-right", floating: true, u: 0.82, v: 0.86, radius: 0.07, aspect: 1.28, strength: 0.38, twist: -0.05, type: 1, floatRangeX: 0.09, floatRangeY: 0.1, floatWander: 0.035, floatSpeed: 0.000065 },
      { name: "float-head-left-edge", floating: true, u: 0.34, v: 0.18, radius: 0.027, aspect: 1.12, strength: 0.76, twist: 0.18, type: 4, floatRangeX: 0.15, floatRangeY: 0.09, floatWander: 0.055, floatSpeed: 0.000115 },
      { name: "float-head-right-edge", floating: true, u: 0.66, v: 0.19, radius: 0.027, aspect: 1.12, strength: 0.76, twist: -0.18, type: 5, floatRangeX: 0.15, floatRangeY: 0.09, floatWander: 0.055, floatSpeed: 0.000105 },
      { name: "float-hair-upper-left", floating: true, u: 0.42, v: 0.1, radius: 0.022, aspect: 0.94, strength: 0.7, twist: 0.16, type: 2, floatRangeX: 0.12, floatRangeY: 0.08, floatWander: 0.06, floatSpeed: 0.00012 },
      { name: "float-hair-upper-right", floating: true, u: 0.58, v: 0.11, radius: 0.022, aspect: 0.94, strength: 0.7, twist: -0.16, type: 2, floatRangeX: 0.12, floatRangeY: 0.08, floatWander: 0.06, floatSpeed: 0.00011 },
      { name: "float-cheek-left-outside", floating: true, u: 0.32, v: 0.29, radius: 0.025, aspect: 1.02, strength: 0.72, twist: 0.12, type: 0, floatRangeX: 0.13, floatRangeY: 0.08, floatWander: 0.052, floatSpeed: 0.0001 },
      { name: "float-cheek-right-outside", floating: true, u: 0.68, v: 0.31, radius: 0.025, aspect: 1.02, strength: 0.72, twist: -0.12, type: 1, floatRangeX: 0.13, floatRangeY: 0.08, floatWander: 0.052, floatSpeed: 0.000095 },
      { name: "float-left-elbow-halo", floating: true, u: 0.2, v: 0.47, radius: 0.026, aspect: 1.28, strength: 0.68, twist: 0.16, type: 6, floatRangeX: 0.13, floatRangeY: 0.1, floatWander: 0.058, floatSpeed: 0.00012 },
      { name: "float-right-elbow-halo", floating: true, u: 0.8, v: 0.48, radius: 0.026, aspect: 1.28, strength: 0.68, twist: -0.16, type: 7, floatRangeX: 0.13, floatRangeY: 0.1, floatWander: 0.058, floatSpeed: 0.00011 },
      { name: "float-left-wrist-trace", floating: true, u: 0.15, v: 0.58, radius: 0.021, aspect: 0.88, strength: 0.75, twist: 0.18, type: 4, floatRangeX: 0.17, floatRangeY: 0.12, floatWander: 0.066, floatSpeed: 0.00013 },
      { name: "float-right-wrist-trace", floating: true, u: 0.85, v: 0.58, radius: 0.021, aspect: 0.88, strength: 0.75, twist: -0.18, type: 5, floatRangeX: 0.17, floatRangeY: 0.12, floatWander: 0.066, floatSpeed: 0.00012 },
      { name: "float-left-torso-edge", floating: true, u: 0.22, v: 0.56, radius: 0.034, aspect: 1.46, strength: 0.56, twist: 0.1, type: 3, floatRangeX: 0.1, floatRangeY: 0.16, floatWander: 0.052, floatSpeed: 0.00009 },
      { name: "float-right-torso-edge", floating: true, u: 0.78, v: 0.59, radius: 0.034, aspect: 1.46, strength: 0.56, twist: -0.1, type: 3, floatRangeX: 0.1, floatRangeY: 0.16, floatWander: 0.052, floatSpeed: 0.000085 },
      { name: "float-crown-left-drift", floating: true, u: 0.3, v: 0.06, radius: 0.024, aspect: 1.2, strength: 0.68, twist: 0.2, type: 2, floatRangeX: 0.18, floatRangeY: 0.08, floatWander: 0.07, floatSpeed: 0.000115 },
      { name: "float-crown-right-small", floating: true, u: 0.63, v: 0.05, radius: 0.018, aspect: 0.76, strength: 0.7, twist: -0.12, type: 4, floatRangeX: 0.13, floatRangeY: 0.07, floatWander: 0.062, floatSpeed: 0.00013 },
      { name: "float-temple-left-far", floating: true, u: 0.18, v: 0.24, radius: 0.031, aspect: 1.52, strength: 0.6, twist: 0.1, type: 6, floatRangeX: 0.12, floatRangeY: 0.09, floatWander: 0.06, floatSpeed: 0.0001 },
      { name: "float-temple-right-near", floating: true, u: 0.74, v: 0.25, radius: 0.022, aspect: 1.04, strength: 0.74, twist: -0.18, type: 5, floatRangeX: 0.11, floatRangeY: 0.08, floatWander: 0.052, floatSpeed: 0.00011 },
      { name: "float-left-shoulder-outer", floating: true, u: 0.14, v: 0.39, radius: 0.036, aspect: 1.24, strength: 0.58, twist: 0.08, type: 0, floatRangeX: 0.12, floatRangeY: 0.12, floatWander: 0.048, floatSpeed: 0.000085 },
      { name: "float-right-shoulder-spark", floating: true, u: 0.84, v: 0.37, radius: 0.019, aspect: 0.9, strength: 0.72, twist: -0.2, type: 2, floatRangeX: 0.13, floatRangeY: 0.1, floatWander: 0.065, floatSpeed: 0.00012 },
      { name: "float-left-hand-behind", floating: true, u: 0.1, v: 0.63, radius: 0.026, aspect: 1.14, strength: 0.76, twist: 0.18, type: 4, floatRangeX: 0.18, floatRangeY: 0.14, floatWander: 0.075, floatSpeed: 0.00013 },
      { name: "float-right-hand-behind", floating: true, u: 0.9, v: 0.51, radius: 0.023, aspect: 1.32, strength: 0.7, twist: -0.14, type: 7, floatRangeX: 0.16, floatRangeY: 0.14, floatWander: 0.07, floatSpeed: 0.00012 },
      { name: "float-left-hip-edge-small", floating: true, u: 0.19, v: 0.7, radius: 0.021, aspect: 1.06, strength: 0.66, twist: 0.12, type: 1, floatRangeX: 0.11, floatRangeY: 0.13, floatWander: 0.052, floatSpeed: 0.0001 },
      { name: "float-right-knee-outside", floating: true, u: 0.85, v: 0.82, radius: 0.029, aspect: 1.36, strength: 0.58, twist: -0.08, type: 3, floatRangeX: 0.13, floatRangeY: 0.1, floatWander: 0.052, floatSpeed: 0.00009 },
      { name: "float-left-finger-halo", floating: true, u: 0.07, v: 0.55, radius: 0.016, aspect: 0.82, strength: 0.76, twist: 0.18, type: 4, floatRangeX: 0.16, floatRangeY: 0.12, floatWander: 0.076, floatSpeed: 0.00014 },
      { name: "float-right-finger-halo", floating: true, u: 0.93, v: 0.6, radius: 0.019, aspect: 1.38, strength: 0.7, twist: -0.16, type: 6, floatRangeX: 0.17, floatRangeY: 0.13, floatWander: 0.074, floatSpeed: 0.00013 },
      { name: "float-neck-left-outside", floating: true, u: 0.34, v: 0.36, radius: 0.022, aspect: 1.16, strength: 0.68, twist: 0.1, type: 1, floatRangeX: 0.1, floatRangeY: 0.09, floatWander: 0.054, floatSpeed: 0.0001 },
      { name: "float-neck-right-thread", floating: true, u: 0.7, v: 0.38, radius: 0.017, aspect: 1.82, strength: 0.72, twist: -0.14, type: 7, floatRangeX: 0.11, floatRangeY: 0.09, floatWander: 0.058, floatSpeed: 0.000115 },
      { name: "float-hairline-front", floating: true, u: 0.5, v: 0.155, radius: 0.02, aspect: 1.02, strength: 0.74, twist: 0.16, type: 5, floatRangeX: 0.12, floatRangeY: 0.07, floatWander: 0.062, floatSpeed: 0.00012 },
      { name: "float-crown-far-right", floating: true, u: 0.78, v: 0.09, radius: 0.025, aspect: 1.48, strength: 0.62, twist: -0.1, type: 3, floatRangeX: 0.16, floatRangeY: 0.08, floatWander: 0.064, floatSpeed: 0.0001 },
      { name: "float-left-elbow-outer-small", floating: true, u: 0.11, v: 0.49, radius: 0.018, aspect: 1.14, strength: 0.72, twist: 0.16, type: 2, floatRangeX: 0.13, floatRangeY: 0.11, floatWander: 0.07, floatSpeed: 0.00013 },
      { name: "float-right-forearm-outside", floating: true, u: 0.89, v: 0.45, radius: 0.027, aspect: 1.64, strength: 0.64, twist: -0.08, type: 0, floatRangeX: 0.12, floatRangeY: 0.12, floatWander: 0.06, floatSpeed: 0.000095 }
    ];

    fillBodyMicroLensGuides(bodyGuides);
    markReleasedArmEnvironmentGuides(bodyGuides);
    fillFloatingMicroLensGuides(floatingGuides);
    markIndependentFloatingGuides(floatingGuides);
    markMisregistrationLensGuides(bodyGuides);
    side2LensGuideCache = mixLensGuides(bodyGuides, floatingGuides);
    side2BodySourceGuideIndexes = buildBodySourceGuideIndexes(side2LensGuideCache);
    return side2LensGuideCache;
  }

  function fillBodyMicroLensGuides(bodyGuides) {
    const clusters = [
      { prefix: "left-finger-micro", points: [POSE_LANDMARKS.leftWrist], u: 0.22, v: 0.54, spreadU: 0.088, spreadV: 0.118, offsetU: -0.082, offsetV: 0.004, radiusMin: 0.0065, radiusMax: 0.017, aspectMin: 0.58, aspectMax: 2.18, strengthMin: 1.12, strengthMax: 1.66, twist: 0.28 },
      { prefix: "right-finger-micro", points: [POSE_LANDMARKS.rightWrist], u: 0.78, v: 0.55, spreadU: 0.088, spreadV: 0.118, offsetU: 0.082, offsetV: 0.006, radiusMin: 0.0065, radiusMax: 0.017, aspectMin: 0.58, aspectMax: 2.18, strengthMin: 1.1, strengthMax: 1.64, twist: -0.28 },
      { prefix: "left-fingertip-field", points: [POSE_LANDMARKS.leftWrist], u: 0.205, v: 0.515, spreadU: 0.115, spreadV: 0.13, offsetU: -0.105, offsetV: -0.03, radiusMin: 0.0038, radiusMax: 0.0115, aspectMin: 0.46, aspectMax: 2.35, strengthMin: 0.9, strengthMax: 1.34, twist: 0.22 },
      { prefix: "right-fingertip-field", points: [POSE_LANDMARKS.rightWrist], u: 0.795, v: 0.515, spreadU: 0.115, spreadV: 0.13, offsetU: 0.105, offsetV: -0.028, radiusMin: 0.0038, radiusMax: 0.0115, aspectMin: 0.46, aspectMax: 2.35, strengthMin: 0.88, strengthMax: 1.32, twist: -0.22 },
      { prefix: "left-palm-knuckle", points: [POSE_LANDMARKS.leftWrist], u: 0.245, v: 0.565, spreadU: 0.052, spreadV: 0.065, offsetU: -0.042, offsetV: 0.034, radiusMin: 0.011, radiusMax: 0.026, aspectMin: 0.72, aspectMax: 1.55, strengthMin: 1.18, strengthMax: 1.58, twist: 0.2 },
      { prefix: "right-palm-knuckle", points: [POSE_LANDMARKS.rightWrist], u: 0.755, v: 0.565, spreadU: 0.052, spreadV: 0.065, offsetU: 0.042, offsetV: 0.034, radiusMin: 0.011, radiusMax: 0.026, aspectMin: 0.72, aspectMax: 1.55, strengthMin: 1.16, strengthMax: 1.56, twist: -0.2 },
      { prefix: "left-forearm-fill", from: POSE_LANDMARKS.leftElbow, to: POSE_LANDMARKS.leftWrist, tMin: 0.18, tMax: 0.82, u: 0.3, v: 0.52, spreadU: 0.026, spreadV: 0.05, radiusMin: 0.0075, radiusMax: 0.022, aspectMin: 0.78, aspectMax: 2.1, strengthMin: 0.72, strengthMax: 1.08, twist: 0.2 },
      { prefix: "right-forearm-fill", from: POSE_LANDMARKS.rightElbow, to: POSE_LANDMARKS.rightWrist, tMin: 0.18, tMax: 0.82, u: 0.7, v: 0.52, spreadU: 0.026, spreadV: 0.05, radiusMin: 0.0075, radiusMax: 0.022, aspectMin: 0.78, aspectMax: 2.1, strengthMin: 0.72, strengthMax: 1.08, twist: -0.2 },
      { prefix: "left-elbow-cluster", points: [POSE_LANDMARKS.leftElbow], u: 0.32, v: 0.485, spreadU: 0.045, spreadV: 0.05, radiusMin: 0.011, radiusMax: 0.03, aspectMin: 0.68, aspectMax: 1.72, strengthMin: 1.1, strengthMax: 1.55, twist: 0.24 },
      { prefix: "right-elbow-cluster", points: [POSE_LANDMARKS.rightElbow], u: 0.68, v: 0.485, spreadU: 0.045, spreadV: 0.05, radiusMin: 0.011, radiusMax: 0.03, aspectMin: 0.68, aspectMax: 1.72, strengthMin: 1.08, strengthMax: 1.53, twist: -0.24 },
      { prefix: "neck-throat-cluster", points: [POSE_LANDMARKS.nose, POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder], u: 0.5, v: 0.395, spreadU: 0.075, spreadV: 0.06, offsetV: 0.04, radiusMin: 0.01, radiusMax: 0.028, aspectMin: 0.66, aspectMax: 1.95, strengthMin: 1.08, strengthMax: 1.46, twist: 0.2 },
      { prefix: "left-neck-side", points: [POSE_LANDMARKS.nose, POSE_LANDMARKS.leftShoulder], u: 0.445, v: 0.39, spreadU: 0.04, spreadV: 0.055, offsetU: -0.046, offsetV: 0.025, radiusMin: 0.009, radiusMax: 0.024, aspectMin: 0.68, aspectMax: 1.9, strengthMin: 1.08, strengthMax: 1.44, twist: -0.22 },
      { prefix: "right-neck-side", points: [POSE_LANDMARKS.nose, POSE_LANDMARKS.rightShoulder], u: 0.56, v: 0.392, spreadU: 0.04, spreadV: 0.055, offsetU: 0.05, offsetV: 0.025, radiusMin: 0.009, radiusMax: 0.024, aspectMin: 0.68, aspectMax: 1.9, strengthMin: 1.08, strengthMax: 1.44, twist: 0.22 },
      { prefix: "forehead-hairline-micro", points: [POSE_LANDMARKS.nose], u: 0.5, v: 0.19, spreadU: 0.11, spreadV: 0.055, offsetV: -0.09, radiusMin: 0.008, radiusMax: 0.023, aspectMin: 0.62, aspectMax: 1.85, strengthMin: 1.16, strengthMax: 1.62, twist: 0.25 },
      { prefix: "crown-top-micro", points: [POSE_LANDMARKS.nose], u: 0.5, v: 0.105, spreadU: 0.12, spreadV: 0.045, offsetV: -0.165, radiusMin: 0.007, radiusMax: 0.02, aspectMin: 0.64, aspectMax: 1.8, strengthMin: 1.08, strengthMax: 1.46, twist: -0.2 },
      { prefix: "left-temple-cheek-dense", points: [POSE_LANDMARKS.leftEye, POSE_LANDMARKS.leftMouth], u: 0.43, v: 0.3, spreadU: 0.072, spreadV: 0.08, offsetU: -0.018, radiusMin: 0.0085, radiusMax: 0.026, aspectMin: 0.6, aspectMax: 1.75, strengthMin: 1.18, strengthMax: 1.7, twist: -0.26 },
      { prefix: "right-temple-cheek-dense", points: [POSE_LANDMARKS.rightEye, POSE_LANDMARKS.rightMouth], u: 0.58, v: 0.305, spreadU: 0.082, spreadV: 0.075, offsetU: 0.026, radiusMin: 0.0085, radiusMax: 0.028, aspectMin: 0.6, aspectMax: 1.85, strengthMin: 1.14, strengthMax: 1.66, twist: 0.26 },
      { prefix: "left-ear-scalp-micro", points: [POSE_LANDMARKS.leftEye], u: 0.37, v: 0.235, spreadU: 0.045, spreadV: 0.09, offsetU: -0.08, offsetV: -0.03, radiusMin: 0.0045, radiusMax: 0.015, aspectMin: 0.56, aspectMax: 1.75, strengthMin: 1.04, strengthMax: 1.45, twist: -0.18 },
      { prefix: "right-ear-scalp-micro", points: [POSE_LANDMARKS.rightEye], u: 0.63, v: 0.235, spreadU: 0.045, spreadV: 0.09, offsetU: 0.08, offsetV: -0.03, radiusMin: 0.0045, radiusMax: 0.015, aspectMin: 0.56, aspectMax: 1.75, strengthMin: 1.04, strengthMax: 1.45, twist: 0.18 },
      { prefix: "jaw-mouth-micro", points: [POSE_LANDMARKS.leftMouth, POSE_LANDMARKS.rightMouth], u: 0.5, v: 0.36, spreadU: 0.09, spreadV: 0.06, offsetV: 0.035, radiusMin: 0.008, radiusMax: 0.025, aspectMin: 0.62, aspectMax: 1.72, strengthMin: 1.14, strengthMax: 1.62, twist: 0.24 },
      { prefix: "left-shoulder-density", points: [POSE_LANDMARKS.leftShoulder], u: 0.39, v: 0.41, spreadU: 0.065, spreadV: 0.06, radiusMin: 0.011, radiusMax: 0.035, aspectMin: 0.72, aspectMax: 1.92, strengthMin: 1.02, strengthMax: 1.42, twist: 0.2 },
      { prefix: "right-shoulder-density", points: [POSE_LANDMARKS.rightShoulder], u: 0.61, v: 0.405, spreadU: 0.055, spreadV: 0.07, radiusMin: 0.01, radiusMax: 0.032, aspectMin: 0.68, aspectMax: 1.82, strengthMin: 1, strengthMax: 1.38, twist: -0.2 },
      { prefix: "upper-arm-density-left", from: POSE_LANDMARKS.leftShoulder, to: POSE_LANDMARKS.leftElbow, tMin: 0.14, tMax: 0.88, u: 0.35, v: 0.45, spreadU: 0.035, spreadV: 0.052, radiusMin: 0.012, radiusMax: 0.033, aspectMin: 0.78, aspectMax: 2, strengthMin: 1, strengthMax: 1.36, twist: 0.18 },
      { prefix: "upper-arm-density-right", from: POSE_LANDMARKS.rightShoulder, to: POSE_LANDMARKS.rightElbow, tMin: 0.14, tMax: 0.88, u: 0.65, v: 0.45, spreadU: 0.035, spreadV: 0.052, radiusMin: 0.012, radiusMax: 0.033, aspectMin: 0.78, aspectMax: 2, strengthMin: 1, strengthMax: 1.36, twist: -0.18 },
      { prefix: "chest-consumption", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.48, spreadU: 0.17, spreadV: 0.13, radiusMin: 0.012, radiusMax: 0.04, aspectMin: 0.66, aspectMax: 1.9, strengthMin: 0.92, strengthMax: 1.3, twist: 0.18 },
      { prefix: "back-abdomen-surface", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.55, spreadU: 0.2, spreadV: 0.18, radiusMin: 0.007, radiusMax: 0.026, aspectMin: 0.58, aspectMax: 1.92, strengthMin: 0.82, strengthMax: 1.18, twist: -0.14 },
      { prefix: "torso-nano-filler", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.53, spreadU: 0.23, spreadV: 0.22, radiusMin: 0.0035, radiusMax: 0.011, aspectMin: 0.52, aspectMax: 1.65, strengthMin: 0.72, strengthMax: 1.08, twist: 0.12 },
      { prefix: "torso-room-growth", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.5, spreadU: 0.26, spreadV: 0.25, radiusMin: 0.0045, radiusMax: 0.018, aspectMin: 0.5, aspectMax: 1.95, strengthMin: 0.78, strengthMax: 1.2, twist: -0.16 },
      { prefix: "upper-torso-env-field", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.43, spreadU: 0.28, spreadV: 0.16, radiusMin: 0.005, radiusMax: 0.021, aspectMin: 0.52, aspectMax: 2.05, strengthMin: 0.72, strengthMax: 1.14, twist: 0.14 },
      { prefix: "lower-torso-env-field", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.64, spreadU: 0.26, spreadV: 0.17, radiusMin: 0.004, radiusMax: 0.018, aspectMin: 0.48, aspectMax: 2.08, strengthMin: 0.68, strengthMax: 1.08, twist: -0.13 },
      { prefix: "torso-edge-env-left", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.leftHip], u: 0.36, v: 0.52, spreadU: 0.09, spreadV: 0.24, offsetU: -0.045, radiusMin: 0.0042, radiusMax: 0.018, aspectMin: 0.48, aspectMax: 2.18, strengthMin: 0.66, strengthMax: 1.08, twist: 0.14 },
      { prefix: "torso-edge-env-right", points: [POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.rightHip], u: 0.64, v: 0.52, spreadU: 0.09, spreadV: 0.24, offsetU: 0.045, radiusMin: 0.0042, radiusMax: 0.018, aspectMin: 0.48, aspectMax: 2.18, strengthMin: 0.66, strengthMax: 1.08, twist: -0.14 },
      { prefix: "chest-micro-colony", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.45, spreadU: 0.21, spreadV: 0.12, radiusMin: 0.005, radiusMax: 0.023, aspectMin: 0.56, aspectMax: 1.82, strengthMin: 0.84, strengthMax: 1.26, twist: 0.18 },
      { prefix: "stomach-micro-colony", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.61, spreadU: 0.22, spreadV: 0.14, radiusMin: 0.004, radiusMax: 0.019, aspectMin: 0.52, aspectMax: 1.88, strengthMin: 0.76, strengthMax: 1.18, twist: -0.14 },
      { prefix: "left-rib-silhouette-colony", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.leftHip], u: 0.37, v: 0.53, spreadU: 0.095, spreadV: 0.19, offsetU: -0.035, radiusMin: 0.004, radiusMax: 0.018, aspectMin: 0.5, aspectMax: 1.95, strengthMin: 0.78, strengthMax: 1.2, twist: 0.16 },
      { prefix: "right-rib-silhouette-colony", points: [POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.rightHip], u: 0.63, v: 0.53, spreadU: 0.095, spreadV: 0.19, offsetU: 0.035, radiusMin: 0.004, radiusMax: 0.018, aspectMin: 0.5, aspectMax: 1.95, strengthMin: 0.78, strengthMax: 1.2, twist: -0.16 },
      { prefix: "left-thigh-consumption", from: POSE_LANDMARKS.leftHip, to: POSE_LANDMARKS.leftKnee, tMin: 0.12, tMax: 0.9, u: 0.4, v: 0.71, spreadU: 0.045, spreadV: 0.075, radiusMin: 0.012, radiusMax: 0.035, aspectMin: 0.74, aspectMax: 2.05, strengthMin: 0.96, strengthMax: 1.34, twist: -0.18 },
      { prefix: "right-thigh-consumption", from: POSE_LANDMARKS.rightHip, to: POSE_LANDMARKS.rightKnee, tMin: 0.12, tMax: 0.9, u: 0.6, v: 0.71, spreadU: 0.045, spreadV: 0.075, radiusMin: 0.012, radiusMax: 0.035, aspectMin: 0.74, aspectMax: 2.05, strengthMin: 0.96, strengthMax: 1.34, twist: 0.18 },
      { prefix: "left-thigh-nano", from: POSE_LANDMARKS.leftHip, to: POSE_LANDMARKS.leftKnee, tMin: 0.04, tMax: 0.96, u: 0.4, v: 0.72, spreadU: 0.06, spreadV: 0.1, radiusMin: 0.0038, radiusMax: 0.012, aspectMin: 0.5, aspectMax: 1.8, strengthMin: 0.78, strengthMax: 1.16, twist: 0.16 },
      { prefix: "right-thigh-nano", from: POSE_LANDMARKS.rightHip, to: POSE_LANDMARKS.rightKnee, tMin: 0.04, tMax: 0.96, u: 0.6, v: 0.72, spreadU: 0.06, spreadV: 0.1, radiusMin: 0.0038, radiusMax: 0.012, aspectMin: 0.5, aspectMax: 1.8, strengthMin: 0.78, strengthMax: 1.16, twist: -0.16 },
      { prefix: "left-knee-lowerleg", from: POSE_LANDMARKS.leftKnee, to: POSE_LANDMARKS.leftAnkle, tMin: 0.02, tMax: 0.88, u: 0.36, v: 0.86, spreadU: 0.05, spreadV: 0.09, radiusMin: 0.01, radiusMax: 0.031, aspectMin: 0.66, aspectMax: 2.15, strengthMin: 0.98, strengthMax: 1.36, twist: 0.2 },
      { prefix: "right-knee-lowerleg", from: POSE_LANDMARKS.rightKnee, to: POSE_LANDMARKS.rightAnkle, tMin: 0.02, tMax: 0.88, u: 0.64, v: 0.86, spreadU: 0.05, spreadV: 0.09, radiusMin: 0.01, radiusMax: 0.031, aspectMin: 0.66, aspectMax: 2.15, strengthMin: 0.98, strengthMax: 1.36, twist: -0.2 },
      { prefix: "left-calf-ankle-nano", from: POSE_LANDMARKS.leftKnee, to: POSE_LANDMARKS.leftAnkle, tMin: 0.12, tMax: 1.04, u: 0.36, v: 0.91, spreadU: 0.055, spreadV: 0.12, radiusMin: 0.0035, radiusMax: 0.013, aspectMin: 0.5, aspectMax: 1.9, strengthMin: 0.78, strengthMax: 1.18, twist: -0.14 },
      { prefix: "right-calf-ankle-nano", from: POSE_LANDMARKS.rightKnee, to: POSE_LANDMARKS.rightAnkle, tMin: 0.12, tMax: 1.04, u: 0.64, v: 0.91, spreadU: 0.055, spreadV: 0.12, radiusMin: 0.0035, radiusMax: 0.013, aspectMin: 0.5, aspectMax: 1.9, strengthMin: 0.78, strengthMax: 1.18, twist: 0.14 },
      { prefix: "left-foot-surface", points: [POSE_LANDMARKS.leftAnkle], u: 0.34, v: 0.99, spreadU: 0.07, spreadV: 0.055, offsetU: -0.02, offsetV: 0.045, radiusMin: 0.004, radiusMax: 0.018, aspectMin: 0.48, aspectMax: 2.1, strengthMin: 0.82, strengthMax: 1.25, twist: 0.18 },
      { prefix: "right-foot-surface", points: [POSE_LANDMARKS.rightAnkle], u: 0.66, v: 0.99, spreadU: 0.07, spreadV: 0.055, offsetU: 0.02, offsetV: 0.045, radiusMin: 0.004, radiusMax: 0.018, aspectMin: 0.48, aspectMax: 2.1, strengthMin: 0.82, strengthMax: 1.25, twist: -0.18 },
      { prefix: "left-hand-nano-fill", points: [POSE_LANDMARKS.leftWrist], u: 0.23, v: 0.56, spreadU: 0.11, spreadV: 0.12, offsetU: -0.058, offsetV: 0.018, radiusMin: 0.0032, radiusMax: 0.0105, aspectMin: 0.5, aspectMax: 1.9, strengthMin: 0.9, strengthMax: 1.32, twist: -0.18 },
      { prefix: "right-hand-nano-fill", points: [POSE_LANDMARKS.rightWrist], u: 0.77, v: 0.56, spreadU: 0.11, spreadV: 0.12, offsetU: 0.058, offsetV: 0.018, radiusMin: 0.0032, radiusMax: 0.0105, aspectMin: 0.5, aspectMax: 1.9, strengthMin: 0.9, strengthMax: 1.32, twist: 0.18 },
      { prefix: "left-fingertip-nano-orbit", points: [POSE_LANDMARKS.leftWrist], u: 0.19, v: 0.515, spreadU: 0.13, spreadV: 0.12, offsetU: -0.13, offsetV: -0.052, radiusMin: 0.0028, radiusMax: 0.0095, aspectMin: 0.44, aspectMax: 2.35, strengthMin: 0.78, strengthMax: 1.18, twist: 0.2 },
      { prefix: "right-fingertip-nano-orbit", points: [POSE_LANDMARKS.rightWrist], u: 0.81, v: 0.515, spreadU: 0.13, spreadV: 0.12, offsetU: 0.13, offsetV: -0.052, radiusMin: 0.0028, radiusMax: 0.0095, aspectMin: 0.44, aspectMax: 2.35, strengthMin: 0.78, strengthMax: 1.18, twist: -0.2 },
      { prefix: "left-finger-web", points: [POSE_LANDMARKS.leftWrist], u: 0.215, v: 0.555, spreadU: 0.12, spreadV: 0.095, offsetU: -0.098, offsetV: 0.008, radiusMin: 0.0035, radiusMax: 0.013, aspectMin: 0.46, aspectMax: 2.1, strengthMin: 0.82, strengthMax: 1.24, twist: -0.16 },
      { prefix: "right-finger-web", points: [POSE_LANDMARKS.rightWrist], u: 0.785, v: 0.555, spreadU: 0.12, spreadV: 0.095, offsetU: 0.098, offsetV: 0.008, radiusMin: 0.0035, radiusMax: 0.013, aspectMin: 0.46, aspectMax: 2.1, strengthMin: 0.82, strengthMax: 1.24, twist: 0.16 },
      { prefix: "left-palm-center-room", points: [POSE_LANDMARKS.leftWrist], u: 0.235, v: 0.57, spreadU: 0.075, spreadV: 0.07, offsetU: -0.072, offsetV: 0.036, radiusMin: 0.0055, radiusMax: 0.018, aspectMin: 0.58, aspectMax: 1.7, strengthMin: 0.82, strengthMax: 1.2, twist: 0.16 },
      { prefix: "right-palm-center-room", points: [POSE_LANDMARKS.rightWrist], u: 0.765, v: 0.57, spreadU: 0.075, spreadV: 0.07, offsetU: 0.072, offsetV: 0.036, radiusMin: 0.0055, radiusMax: 0.018, aspectMin: 0.58, aspectMax: 1.7, strengthMin: 0.82, strengthMax: 1.2, twist: -0.16 },
      { prefix: "torso-room-exchange-center", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.525, spreadU: 0.24, spreadV: 0.23, radiusMin: 0.0042, radiusMax: 0.017, aspectMin: 0.48, aspectMax: 2.1, strengthMin: 0.7, strengthMax: 1.08, twist: 0.13 },
      { prefix: "torso-room-exchange-upper", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.445, spreadU: 0.27, spreadV: 0.14, radiusMin: 0.004, radiusMax: 0.0165, aspectMin: 0.48, aspectMax: 2.15, strengthMin: 0.7, strengthMax: 1.08, twist: -0.12 },
      { prefix: "torso-room-exchange-lower", points: [POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder, POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip], u: 0.5, v: 0.635, spreadU: 0.25, spreadV: 0.15, radiusMin: 0.0038, radiusMax: 0.0155, aspectMin: 0.46, aspectMax: 2.18, strengthMin: 0.66, strengthMax: 1.04, twist: 0.11 },
      { prefix: "hip-torso-micro", points: [POSE_LANDMARKS.leftHip, POSE_LANDMARKS.rightHip, POSE_LANDMARKS.leftShoulder, POSE_LANDMARKS.rightShoulder], u: 0.5, v: 0.57, spreadU: 0.14, spreadV: 0.13, radiusMin: 0.011, radiusMax: 0.032, aspectMin: 0.66, aspectMax: 1.85, strengthMin: 0.9, strengthMax: 1.24, twist: 0.16 }
    ];

    let clusterIndex = 0;
    while (bodyGuides.length < SIDE2_LENS_BODY_COUNT) {
      const cluster = clusters[clusterIndex % clusters.length];
      const localIndex = Math.floor(clusterIndex / clusters.length);
      bodyGuides.push(createOrganicBodyLensGuide(cluster, localIndex, clusterIndex));
      clusterIndex += 1;
    }
  }

  function createOrganicBodyLensGuide(cluster, localIndex, seed) {
    const first = hash2(seed + 3, localIndex + 5, 701);
    const second = hash2(seed + 11, localIndex + 17, 709);
    const third = hash2(seed + 19, localIndex + 23, 719);
    const fourth = hash2(seed + 29, localIndex + 31, 727);
    const fifth = hash2(seed + 37, localIndex + 41, 733);
    const sixth = hash2(seed + 43, localIndex + 47, 739);
    const typeRoll = Math.floor(hash2(seed + 53, localIndex + 59, 743) * 8);
    const guide = {
      name: cluster.prefix + "-" + localIndex,
      u: clamp(cluster.u + lerp(-cluster.spreadU, cluster.spreadU, first), -0.08, 1.08),
      v: clamp(cluster.v + lerp(-cluster.spreadV, cluster.spreadV, second), -0.12, 1.12),
      radius: lerp(cluster.radiusMin, cluster.radiusMax, third),
      aspect: lerp(cluster.aspectMin, cluster.aspectMax, fourth),
      strength: lerp(cluster.strengthMin, cluster.strengthMax, fifth),
      twist: lerp(-Math.abs(cluster.twist), Math.abs(cluster.twist), sixth),
      type: typeRoll,
      offsetU: (cluster.offsetU || 0) + lerp(-cluster.spreadU, cluster.spreadU, first) * 0.42,
      offsetV: (cluster.offsetV || 0) + lerp(-cluster.spreadV, cluster.spreadV, second) * 0.42
    };
    const overflowSeed = hash2(seed + 97, localIndex + 101, 857);
    const overflowChance = /finger|hand|palm|knuckle|ear|scalp|shoulder|elbow|knee|lowerleg|ankle|foot|crown|hairline|silhouette|rib|neck/.test(cluster.prefix) ? 0.48 : 0.28;

    if (overflowSeed < overflowChance) {
      const lateral = guide.u < 0.5 ? -1 : 1;
      guide.offsetU += lateral * lerp(0.018, 0.078, hash2(seed + 103, localIndex + 107, 859));
      guide.offsetV += lerp(-0.052, 0.058, hash2(seed + 109, localIndex + 113, 863));
      guide.radius *= lerp(0.86, 1.18, hash2(seed + 127, localIndex + 131, 877));
    }

    if (Number.isFinite(cluster.from) && Number.isFinite(cluster.to)) {
      guide.from = cluster.from;
      guide.to = cluster.to;
      guide.t = lerp(cluster.tMin || 0.18, cluster.tMax || 0.84, hash2(seed + 61, localIndex + 67, 751));
    } else {
      guide.points = cluster.points;
    }

    if (third > 0.86) guide.blur = lerp(0.05, 0.13, fifth);
    return guide;
  }

  function markReleasedArmEnvironmentGuides(bodyGuides) {
    for (let index = 0; index < bodyGuides.length; index += 1) {
      const guide = bodyGuides[index];
      if (!guide || guide.floating) continue;

      const name = guide.name || "";
      const isHand = /hand|wrist|finger|palm|knuckle|thumb|index|ring|little/.test(name);
      const isArm = /forearm|upper-arm|elbow/.test(name);
      if (!isHand && !isArm) continue;

      const coreHandAnchor = /^(left-hand|right-hand)$|wrist-tiny|palm-broad|palm-pin/.test(name);
      let releaseChance = isArm ? SIDE2_LENS_RELEASED_ARM_RATIO : SIDE2_LENS_RELEASED_HAND_RATIO;

      if (/forearm-fill|upper-arm-density|elbow-cluster/.test(name)) releaseChance -= 0.04;
      if (/finger-micro|fingertip-field|hand-nano-fill|palm-knuckle/.test(name)) releaseChance += 0.14;
      if (coreHandAnchor) releaseChance *= 0.18;

      const roll = hash2(index + name.length, index * 7 + 43, 941);
      if (roll > clamp(releaseChance, 0.04, 0.82)) continue;

      const distanceRoll = hash2(index + 17, name.length + 23, 947);
      const wanderRoll = hash2(index + 31, name.length + 37, 953);
      guide.released = true;
      guide.releaseAmount = lerp(isArm ? 0.46 : 0.44, isArm ? 0.82 : 0.84, roll);
      guide.releaseDistance = lerp(isArm ? 0.14 : 0.1, isArm ? 0.36 : 0.3, distanceRoll);
      guide.releaseWander = lerp(0.034, isArm ? 0.13 : 0.11, wanderRoll);
      guide.releaseCycleRate = lerp(0.00004, 0.00013, hash2(index + 47, name.length + 53, 967));
      guide.returnCycleRate = lerp(0.000025, 0.000075, hash2(index + 59, name.length + 61, 971));
      guide.releaseOrbitRate = lerp(0.000055, 0.00016, hash2(index + 67, name.length + 71, 977));
      guide.strength *= isArm ? 0.92 : 0.96;
    }
  }

  function fillFloatingMicroLensGuides(floatingGuides) {
    const clusters = [
      { prefix: "float-head-atmosphere", u: 0.5, v: 0.16, spreadU: 0.32, spreadV: 0.17, radiusMin: 0.01, radiusMax: 0.032, aspectMin: 0.68, aspectMax: 1.72, strengthMin: 0.46, strengthMax: 0.82, rangeX: 0.1, rangeY: 0.075, wander: 0.065, speedMin: 0.00007, speedMax: 0.00015 },
      { prefix: "float-hair-crown-field", u: 0.5, v: 0.04, spreadU: 0.34, spreadV: 0.09, radiusMin: 0.009, radiusMax: 0.027, aspectMin: 0.62, aspectMax: 1.9, strengthMin: 0.44, strengthMax: 0.78, rangeX: 0.14, rangeY: 0.065, wander: 0.08, speedMin: 0.00008, speedMax: 0.00016 },
      { prefix: "float-shoulder-silhouette", u: 0.5, v: 0.39, spreadU: 0.44, spreadV: 0.12, radiusMin: 0.011, radiusMax: 0.035, aspectMin: 0.7, aspectMax: 1.9, strengthMin: 0.42, strengthMax: 0.76, rangeX: 0.11, rangeY: 0.1, wander: 0.07, speedMin: 0.00006, speedMax: 0.00014 },
      { prefix: "float-hand-cloud-left", u: 0.1, v: 0.57, spreadU: 0.24, spreadV: 0.2, radiusMin: 0.007, radiusMax: 0.024, aspectMin: 0.62, aspectMax: 1.82, strengthMin: 0.46, strengthMax: 0.82, rangeX: 0.23, rangeY: 0.16, wander: 0.11, speedMin: 0.000072, speedMax: 0.00016 },
      { prefix: "float-hand-cloud-right", u: 0.9, v: 0.56, spreadU: 0.24, spreadV: 0.2, radiusMin: 0.007, radiusMax: 0.024, aspectMin: 0.62, aspectMax: 1.82, strengthMin: 0.46, strengthMax: 0.82, rangeX: 0.23, rangeY: 0.16, wander: 0.11, speedMin: 0.000072, speedMax: 0.00016 },
      { prefix: "float-arm-edge-left", u: 0.13, v: 0.49, spreadU: 0.24, spreadV: 0.22, radiusMin: 0.007, radiusMax: 0.024, aspectMin: 0.58, aspectMax: 2.05, strengthMin: 0.38, strengthMax: 0.72, rangeX: 0.2, rangeY: 0.16, wander: 0.105, speedMin: 0.00006, speedMax: 0.00014 },
      { prefix: "float-arm-edge-right", u: 0.87, v: 0.49, spreadU: 0.24, spreadV: 0.22, radiusMin: 0.007, radiusMax: 0.024, aspectMin: 0.58, aspectMax: 2.05, strengthMin: 0.38, strengthMax: 0.72, rangeX: 0.2, rangeY: 0.16, wander: 0.105, speedMin: 0.00006, speedMax: 0.00014 },
      { prefix: "float-body-silhouette", u: 0.5, v: 0.66, spreadU: 0.56, spreadV: 0.32, radiusMin: 0.008, radiusMax: 0.029, aspectMin: 0.6, aspectMax: 2.02, strengthMin: 0.38, strengthMax: 0.74, rangeX: 0.2, rangeY: 0.22, wander: 0.11, speedMin: 0.000048, speedMax: 0.000125 },
      { prefix: "float-torso-spore-field", u: 0.5, v: 0.52, spreadU: 0.66, spreadV: 0.4, radiusMin: 0.005, radiusMax: 0.023, aspectMin: 0.5, aspectMax: 2.16, strengthMin: 0.48, strengthMax: 0.88, rangeX: 0.24, rangeY: 0.24, wander: 0.13, speedMin: 0.000048, speedMax: 0.00014 },
      { prefix: "float-silhouette-overflow", u: 0.5, v: 0.56, spreadU: 0.7, spreadV: 0.42, radiusMin: 0.0045, radiusMax: 0.019, aspectMin: 0.5, aspectMax: 2.12, strengthMin: 0.36, strengthMax: 0.74, rangeX: 0.23, rangeY: 0.22, wander: 0.118, speedMin: 0.000058, speedMax: 0.00015 },
      { prefix: "float-left-open-space", u: 0.04, v: 0.42, spreadU: 0.3, spreadV: 0.34, radiusMin: 0.0045, radiusMax: 0.02, aspectMin: 0.5, aspectMax: 2.18, strengthMin: 0.32, strengthMax: 0.68, rangeX: 0.3, rangeY: 0.22, wander: 0.14, speedMin: 0.00004, speedMax: 0.00012 },
      { prefix: "float-right-open-space", u: 0.96, v: 0.42, spreadU: 0.3, spreadV: 0.34, radiusMin: 0.0045, radiusMax: 0.02, aspectMin: 0.5, aspectMax: 2.18, strengthMin: 0.32, strengthMax: 0.68, rangeX: 0.3, rangeY: 0.22, wander: 0.14, speedMin: 0.00004, speedMax: 0.00012 },
      { prefix: "float-between-arms-field", u: 0.5, v: 0.42, spreadU: 0.62, spreadV: 0.26, radiusMin: 0.0045, radiusMax: 0.019, aspectMin: 0.5, aspectMax: 2.18, strengthMin: 0.34, strengthMax: 0.7, rangeX: 0.18, rangeY: 0.15, wander: 0.096, speedMin: 0.00005, speedMax: 0.00014 },
      { prefix: "float-room-return", u: 0.5, v: 0.6, spreadU: 0.84, spreadV: 0.54, radiusMin: 0.0038, radiusMax: 0.017, aspectMin: 0.48, aspectMax: 2.24, strengthMin: 0.32, strengthMax: 0.7, rangeX: 0.32, rangeY: 0.28, wander: 0.16, speedMin: 0.000036, speedMax: 0.000112 },
      { prefix: "float-torso-front-air", u: 0.5, v: 0.51, spreadU: 0.42, spreadV: 0.2, radiusMin: 0.0048, radiusMax: 0.019, aspectMin: 0.52, aspectMax: 2.08, strengthMin: 0.44, strengthMax: 0.8, rangeX: 0.26, rangeY: 0.18, wander: 0.13, speedMin: 0.000044, speedMax: 0.00013 },
      { prefix: "float-torso-side-air-left", u: 0.18, v: 0.58, spreadU: 0.24, spreadV: 0.24, radiusMin: 0.0045, radiusMax: 0.018, aspectMin: 0.5, aspectMax: 2.18, strengthMin: 0.36, strengthMax: 0.72, rangeX: 0.3, rangeY: 0.22, wander: 0.145, speedMin: 0.00004, speedMax: 0.00012 },
      { prefix: "float-torso-side-air-right", u: 0.82, v: 0.57, spreadU: 0.24, spreadV: 0.24, radiusMin: 0.0045, radiusMax: 0.018, aspectMin: 0.5, aspectMax: 2.18, strengthMin: 0.36, strengthMax: 0.72, rangeX: 0.3, rangeY: 0.22, wander: 0.145, speedMin: 0.00004, speedMax: 0.00012 },
      { prefix: "float-finger-air-left", u: 0.02, v: 0.58, spreadU: 0.18, spreadV: 0.22, radiusMin: 0.0038, radiusMax: 0.015, aspectMin: 0.48, aspectMax: 2.28, strengthMin: 0.42, strengthMax: 0.78, rangeX: 0.28, rangeY: 0.2, wander: 0.15, speedMin: 0.000052, speedMax: 0.00015 },
      { prefix: "float-finger-air-right", u: 0.98, v: 0.58, spreadU: 0.18, spreadV: 0.22, radiusMin: 0.0038, radiusMax: 0.015, aspectMin: 0.48, aspectMax: 2.28, strengthMin: 0.42, strengthMax: 0.78, rangeX: 0.28, rangeY: 0.2, wander: 0.15, speedMin: 0.000052, speedMax: 0.00015 },
      { prefix: "float-neck-head-spores", u: 0.5, v: 0.28, spreadU: 0.4, spreadV: 0.18, radiusMin: 0.006, radiusMax: 0.024, aspectMin: 0.56, aspectMax: 1.9, strengthMin: 0.44, strengthMax: 0.82, rangeX: 0.14, rangeY: 0.1, wander: 0.082, speedMin: 0.00007, speedMax: 0.00016 },
      { prefix: "float-leg-spore-left", u: 0.31, v: 0.83, spreadU: 0.22, spreadV: 0.22, radiusMin: 0.005, radiusMax: 0.021, aspectMin: 0.54, aspectMax: 2.08, strengthMin: 0.38, strengthMax: 0.74, rangeX: 0.12, rangeY: 0.15, wander: 0.074, speedMin: 0.000055, speedMax: 0.00014 },
      { prefix: "float-leg-spore-right", u: 0.69, v: 0.83, spreadU: 0.22, spreadV: 0.22, radiusMin: 0.005, radiusMax: 0.021, aspectMin: 0.54, aspectMax: 2.08, strengthMin: 0.38, strengthMax: 0.74, rangeX: 0.12, rangeY: 0.15, wander: 0.074, speedMin: 0.000055, speedMax: 0.00014 },
      { prefix: "float-foot-toe-spores", u: 0.5, v: 1.01, spreadU: 0.46, spreadV: 0.12, radiusMin: 0.0045, radiusMax: 0.018, aspectMin: 0.5, aspectMax: 2.1, strengthMin: 0.34, strengthMax: 0.7, rangeX: 0.13, rangeY: 0.08, wander: 0.068, speedMin: 0.000055, speedMax: 0.00013 }
    ];

    let clusterIndex = 0;
    while (floatingGuides.length < SIDE2_LENS_FLOATING_COUNT) {
      const cluster = clusters[clusterIndex % clusters.length];
      const localIndex = Math.floor(clusterIndex / clusters.length);
      floatingGuides.push(createOrganicFloatingLensGuide(cluster, localIndex, clusterIndex));
      clusterIndex += 1;
    }
  }

  function createOrganicFloatingLensGuide(cluster, localIndex, seed) {
    const first = hash2(seed + 7, localIndex + 3, 761);
    const second = hash2(seed + 13, localIndex + 11, 769);
    const third = hash2(seed + 17, localIndex + 19, 773);
    const fourth = hash2(seed + 31, localIndex + 29, 787);
    const fifth = hash2(seed + 41, localIndex + 37, 797);

    return {
      name: cluster.prefix + "-" + localIndex,
      floating: true,
      u: clamp(cluster.u + lerp(-cluster.spreadU, cluster.spreadU, first), -0.28, 1.28),
      v: clamp(cluster.v + lerp(-cluster.spreadV, cluster.spreadV, second), -0.22, 1.22),
      radius: lerp(cluster.radiusMin, cluster.radiusMax, third),
      aspect: lerp(cluster.aspectMin, cluster.aspectMax, fourth),
      strength: lerp(cluster.strengthMin, cluster.strengthMax, fifth),
      twist: lerp(-0.2, 0.2, hash2(seed + 47, localIndex + 43, 809)),
      type: Math.floor(hash2(seed + 53, localIndex + 59, 811) * 8),
      blur: third > 0.88 ? lerp(0.06, 0.16, fifth) : 0,
      floatRangeX: cluster.rangeX * lerp(0.82, 1.58, hash2(seed + 61, localIndex + 67, 821)),
      floatRangeY: cluster.rangeY * lerp(0.8, 1.45, hash2(seed + 71, localIndex + 73, 823)),
      floatWander: cluster.wander * lerp(0.76, 1.62, hash2(seed + 79, localIndex + 83, 827)),
      floatSpeed: lerp(cluster.speedMin, cluster.speedMax, hash2(seed + 89, localIndex + 97, 829))
    };
  }

  function markIndependentFloatingGuides(floatingGuides) {
    for (let index = 0; index < floatingGuides.length; index += 1) {
      const guide = floatingGuides[index];
      if (!guide || !guide.floating) continue;

      const ratio = getFloatingGuideIndependenceRatio(guide.name || "");
      guide.freeFloating = hash2(index + 127, (guide.name || "").length * 11, 1481) < ratio;
      guide.freePullToBody = lerp(0.22, 0.72, hash2(index + 139, (guide.name || "").length * 13, 1499));
      guide.freeOrbitPreference = lerp(0.18, 0.84, hash2(index + 151, (guide.name || "").length * 17, 1511));
    }
  }

  function getFloatingGuideIndependenceRatio(name) {
    if (/room-return|open-space|torso-side-air|finger-air/.test(name)) return 0.94;
    if (/torso-front-air|torso-spore|silhouette-overflow|body-silhouette/.test(name)) return 0.82;
    if (/hand-cloud|arm-edge|between-arms/.test(name)) return 0.72;
    if (/head|hair|crown|face|neck/.test(name)) return 0.56;
    if (/leg|foot|toe/.test(name)) return 0.64;
    return 0.42;
  }

  function markMisregistrationLensGuides(bodyGuides) {
    const forced = new Set(getMisregistrationLensNames());
    let marked = 0;

    bodyGuides.forEach((guide) => {
      if (forced.has(guide.name)) {
        guide.misregister = true;
        marked += 1;
      }
    });

    const candidates = bodyGuides
      .filter((guide) => guide && !guide.misregister && !isTorsoEnvironmentLensGuide(guide.name) && isMisregistrationSourceGuide(guide.name))
      .map((guide, index) => ({
        guide,
        score: hash2(index + guide.name.length, index * 3 + 17, 839)
      }))
      .sort((a, b) => b.score - a.score);

    for (let index = 0; index < candidates.length && marked < SIDE2_LENS_MISREGISTRATION_COUNT; index += 1) {
      candidates[index].guide.misregister = true;
      marked += 1;
    }
  }

  function mixLensGuides(bodyGuides, floatingGuides) {
    const output = [];
    let floatingIndex = 0;

    bodyGuides.forEach((guide, index) => {
      output.push(guide);

      const floatingSlots = index < 48
        ? (index % 4 === 0 ? 2 : 1)
        : (index % 2 === 0 || index % 7 === 3 ? 1 : 0);

      for (let slot = 0; slot < floatingSlots && floatingIndex < floatingGuides.length; slot += 1) {
        output.push(floatingGuides[floatingIndex]);
        floatingIndex += 1;
      }
    });

    while (floatingIndex < floatingGuides.length) {
      output.push(floatingGuides[floatingIndex]);
      floatingIndex += 1;
    }

    return output.slice(0, SIDE2_LENS_MAX_COUNT);
  }

  function getResolvedLensAnchor(guide, lens, bounds, now, progress, dt) {
    if (guide.floating) {
      return getFloatingLensAnchor(guide, lens, bounds, now, progress, dt);
    }

    const anchor = getLensAnchor(guide, bounds) || getFallbackLensAnchor(guide, bounds);
    if (!guide.released) return anchor;

    return getReleasedLensAnchor(guide, lens, bounds, anchor, now, progress);
  }

  function getReleasedLensAnchor(guide, lens, bounds, anchor, now, progress) {
    const safeBounds = bounds || { x: 0, y: 0, width: canvas.width || 1, height: canvas.height || 1 };
    const bodyScale = Math.max(safeBounds.width, safeBounds.height);
    const phase = lens ? lens.phase : 0;
    const centerX = safeBounds.x + safeBounds.width * 0.5;
    const centerY = safeBounds.y + safeBounds.height * 0.52;
    let outwardX = anchor.x - centerX;
    let outwardY = anchor.y - centerY;
    let outwardLength = Math.hypot(outwardX, outwardY);

    if (outwardLength < 1) {
      outwardX = guide.u < 0.5 ? -1 : 1;
      outwardY = Math.sin(phase) * 0.45;
      outwardLength = Math.hypot(outwardX, outwardY);
    }

    outwardX /= outwardLength;
    outwardY /= outwardLength;

    const tangentX = -outwardY;
    const tangentY = outwardX;
    const releaseStage = smoothstep(SIDE2_LENS_RELEASE_MIN_PROGRESS, 0.92, progress);
    const releaseCycle = 0.5 + Math.sin(now * (guide.releaseCycleRate || 0.00008) + phase * 1.73) * 0.5;
    const releaseBreath = smoothstep(0.1, 0.92, releaseCycle);
    const returnTide = 0.5 + Math.sin(now * (guide.returnCycleRate || 0.000045) + phase * 2.9) * 0.5;
    const releaseAmount = releaseStage * (guide.releaseAmount || 0.56) * lerp(0.28, 1, releaseBreath) * lerp(0.72, 1.08, returnTide);
    const releaseDistance = bodyScale * (guide.releaseDistance || 0.12) * releaseAmount;
    const wanderDistance = bodyScale * (guide.releaseWander || 0.035) * releaseStage;
    const orbit = now * (guide.releaseOrbitRate || 0.00011) + phase;
    const targetX = anchor.x
      + outwardX * releaseDistance
      + tangentX * Math.sin(orbit) * wanderDistance
      + Math.sin(orbit * 0.43 + phase * 2.2) * wanderDistance * 0.64;
    const targetY = anchor.y
      + outwardY * releaseDistance
      + tangentY * Math.cos(orbit * 0.8) * wanderDistance * 0.78
      + Math.cos(orbit * 0.37 + phase) * wanderDistance * 0.52;

    return {
      x: clamp(targetX, safeBounds.x - safeBounds.width * 0.5, safeBounds.x + safeBounds.width * 1.5),
      y: clamp(targetY, safeBounds.y - safeBounds.height * 0.42, safeBounds.y + safeBounds.height * 1.42),
      angle: anchor.angle + Math.sin(orbit * 0.62 + phase) * 0.42 * releaseAmount
    };
  }

  function getLensAnchor(guide, providedBounds) {
    const bounds = providedBounds || getLocalEffectBounds(0);
    if (!bounds || bounds.width <= 1 || bounds.height <= 1) return null;

    if (Number.isFinite(guide.from) && Number.isFinite(guide.to)) {
      const start = getPosePoint(guide.from);
      const end = getPosePoint(guide.to);
      if (start && end) {
        const t = guide.t ?? 0.5;
        const x = lerp(start.x, end.x, t);
        const y = lerp(start.y, end.y, t);
        const angle = Math.atan2(end.y - start.y, end.x - start.x);
        return offsetLensAnchor({ x, y, angle }, guide, bounds);
      }
    }

    if (guide.points && guide.points.length) {
      let totalX = 0;
      let totalY = 0;
      let count = 0;

      guide.points.forEach((index) => {
        const point = getPosePoint(index);
        if (!point) return;
        totalX += point.x;
        totalY += point.y;
        count += 1;
      });

      if (count) {
        return offsetLensAnchor({
          x: totalX / count,
          y: totalY / count,
          angle: 0
        }, guide, bounds);
      }
    }

    return getFallbackLensAnchor(guide, bounds);
  }

  function getFloatingLensAnchor(guide, lens, bounds, now, progress, dt) {
    const bodyAnchor = getBodyRelativeFloatingLensAnchor(guide, lens, bounds, now);
    if (!lens || !lens.freeFloating || progress < SIDE2_FLOATING_FREE_MIN_PROGRESS) return bodyAnchor;

    return getIndependentFloatingLensAnchor(guide, lens, bounds, now, progress, dt, bodyAnchor);
  }

  function getBodyRelativeFloatingLensAnchor(guide, lens, bounds, now) {
    const safeBounds = bounds || { x: 0, y: 0, width: canvas.width || 1, height: canvas.height || 1 };
    const bodyScale = Math.max(safeBounds.width, safeBounds.height);
    const phase = lens ? lens.phase : 0;
    const slowTime = now * (guide.floatSpeed || 0.00008);
    const centerX = safeBounds.x + safeBounds.width * guide.u;
    const centerY = safeBounds.y + safeBounds.height * guide.v;
    const orbitX = Math.cos(slowTime + phase) * bodyScale * (guide.floatRangeX || 0.18);
    const orbitY = Math.sin(slowTime * 0.83 + phase * 1.7) * bodyScale * (guide.floatRangeY || 0.13);
    const wanderX = Math.sin(slowTime * 0.37 + phase * 2.4) * bodyScale * (guide.floatWander || 0.06);
    const wanderY = Math.cos(slowTime * 0.51 + phase * 1.2) * bodyScale * (guide.floatWander || 0.06);

    return {
      x: clamp(centerX + orbitX + wanderX, safeBounds.x - safeBounds.width * 0.56, safeBounds.x + safeBounds.width * 1.56),
      y: clamp(centerY + orbitY + wanderY, safeBounds.y - safeBounds.height * 0.44, safeBounds.y + safeBounds.height * 1.44),
      angle: slowTime * (guide.spin || 0.18) + phase * 0.24
    };
  }

  function getIndependentFloatingLensAnchor(guide, lens, bounds, now, progress, dt, bodyAnchor) {
    const safeBounds = bounds || { x: 0, y: 0, width: canvas.width || 1, height: canvas.height || 1 };
    const bodyScale = Math.max(90, Math.max(safeBounds.width, safeBounds.height));
    const step = clamp(dt || 0.016, 0.001, 0.08);
    const stagePower = smoothstep(SIDE2_FLOATING_FREE_MIN_PROGRESS, 1, progress);

    if (!lens.freeReady || !Number.isFinite(lens.freeX) || !Number.isFinite(lens.freeY)) {
      const angle = lens.phase + hash2(lens.guideIndex, (guide.name || "").length, 1523) * Math.PI * 2;
      const distance = bodyScale * lerp(0.08, 0.28, hash2(lens.guideIndex + 7, (guide.name || "").length, 1531));
      lens.freeX = bodyAnchor.x + Math.cos(angle) * distance;
      lens.freeY = bodyAnchor.y + Math.sin(angle) * distance * 0.72;
      lens.freeTargetX = lens.freeX;
      lens.freeTargetY = lens.freeY;
      lens.freeNextDecisionAt = now;
      lens.freeReady = true;
    }

    if (!lens.freeNextDecisionAt || now >= lens.freeNextDecisionAt) {
      chooseIndependentFloatingTarget(guide, lens, safeBounds, bodyAnchor, bodyScale, now, stagePower);
    }

    const paused = now < lens.freePauseUntil ? 0.18 : 1;
    const targetPull = lens.freeTargetPull * paused * lerp(0.44, 1, stagePower);
    lens.freeVx += (lens.freeTargetX - lens.freeX) * targetPull * step;
    lens.freeVy += (lens.freeTargetY - lens.freeY) * targetPull * step;

    const bodyPull = (guide.freePullToBody || 0.4) * lens.freeAttraction * lerp(0.32, 1, stagePower);
    lens.freeVx += (bodyAnchor.x - lens.freeX) * bodyPull * step;
    lens.freeVy += (bodyAnchor.y - lens.freeY) * bodyPull * step;

    applyFloatingBodyInteraction(lens, safeBounds, bodyScale, step, stagePower);
    applyFloatingHandFlow(lens, bodyScale, step, stagePower);

    const drag = Math.exp(-step * lerp(0.62, 1.28, hash1(lens.guideIndex, 1543)));
    lens.freeVx *= drag;
    lens.freeVy *= drag;

    const maxSpeed = bodyScale * SIDE2_FLOATING_FREE_MAX_SPEED;
    const speed = Math.hypot(lens.freeVx, lens.freeVy);
    if (speed > maxSpeed) {
      lens.freeVx = lens.freeVx / speed * maxSpeed;
      lens.freeVy = lens.freeVy / speed * maxSpeed;
    }

    lens.freeX = clamp(lens.freeX + lens.freeVx * step, safeBounds.x - safeBounds.width * 0.58, safeBounds.x + safeBounds.width * 1.58);
    lens.freeY = clamp(lens.freeY + lens.freeVy * step, safeBounds.y - safeBounds.height * 0.46, safeBounds.y + safeBounds.height * 1.46);

    const returnBlend = 1 - Math.exp(-step / lerp(7.5, 18, hash1(lens.guideIndex, 1559)));

    return {
      x: lerp(lens.freeX, bodyAnchor.x, returnBlend * (1 - stagePower) * 0.28),
      y: lerp(lens.freeY, bodyAnchor.y, returnBlend * (1 - stagePower) * 0.28),
      angle: bodyAnchor.angle + Math.atan2(lens.freeVy, lens.freeVx || 0.001) * 0.08
    };
  }

  function chooseIndependentFloatingTarget(guide, lens, bounds, bodyAnchor, bodyScale, now, stagePower) {
    const seedA = hash2(lens.guideIndex + Math.floor(now / 1000), (guide.name || "").length, 1567);
    const seedB = hash2(lens.guideIndex + Math.floor(now / 1300), (guide.name || "").length * 3, 1571);
    const seedC = hash2(lens.guideIndex + Math.floor(now / 1700), (guide.name || "").length * 5, 1579);
    const centerX = bounds.x + bounds.width * 0.5;
    const centerY = bounds.y + bounds.height * 0.52;
    const mode = Math.floor(seedA * 5);
    const angle = seedB * Math.PI * 2;
    const freeDistance = bodyScale * lerp(0.12, 0.48, seedC) * lerp(0.62, 1.08, stagePower);

    lens.freeMode = mode;
    lens.freeNextDecisionAt = now + lerp(2600, 9800, seedC);
    lens.freePauseUntil = mode === 3 ? now + lerp(600, 2200, seedB) : 0;

    if (mode === 0) {
      lens.freeTargetX = bodyAnchor.x + Math.cos(angle) * freeDistance;
      lens.freeTargetY = bodyAnchor.y + Math.sin(angle) * freeDistance * 0.78;
    } else if (mode === 1) {
      lens.freeTargetX = centerX + Math.cos(angle) * bodyScale * lerp(0.18, 0.56, seedC);
      lens.freeTargetY = centerY + Math.sin(angle) * bodyScale * lerp(0.12, 0.4, seedB);
    } else if (mode === 2) {
      lens.freeTargetX = lerp(lens.freeX, bodyAnchor.x, lerp(0.42, 0.78, seedB));
      lens.freeTargetY = lerp(lens.freeY, bodyAnchor.y, lerp(0.42, 0.78, seedC));
    } else if (mode === 3) {
      lens.freeTargetX = lens.freeX + Math.cos(angle) * bodyScale * lerp(0.02, 0.12, seedC);
      lens.freeTargetY = lens.freeY + Math.sin(angle) * bodyScale * lerp(0.02, 0.1, seedB);
    } else {
      const orbitPreference = guide.freeOrbitPreference || 0.5;
      lens.freeTargetX = centerX + Math.cos(angle + orbitPreference) * bodyScale * lerp(0.16, 0.38, seedC);
      lens.freeTargetY = centerY + Math.sin(angle + orbitPreference) * bodyScale * lerp(0.1, 0.32, seedB);
    }

    lens.freeTargetX = clamp(lens.freeTargetX, bounds.x - bounds.width * 0.54, bounds.x + bounds.width * 1.54);
    lens.freeTargetY = clamp(lens.freeTargetY, bounds.y - bounds.height * 0.44, bounds.y + bounds.height * 1.44);
  }

  function applyFloatingBodyInteraction(lens, bounds, bodyScale, dt, stagePower) {
    const centerX = bounds.x + bounds.width * 0.5;
    const centerY = bounds.y + bounds.height * 0.52;
    const radiusX = Math.max(32, bounds.width * 0.52);
    const radiusY = Math.max(48, bounds.height * 0.52);
    const nx = (lens.freeX - centerX) / radiusX;
    const ny = (lens.freeY - centerY) / radiusY;
    const distance = Math.hypot(nx, ny);

    if (distance < SIDE2_FLOATING_FREE_BODY_COLLISION_RADIUS) {
      const safeDistance = Math.max(0.001, distance);
      const push = (SIDE2_FLOATING_FREE_BODY_COLLISION_RADIUS - safeDistance) * lens.freeCollisionPush * lerp(0.45, 1, stagePower);
      lens.freeVx += (nx / safeDistance) * push * dt;
      lens.freeVy += (ny / safeDistance) * push * dt;
      return;
    }

    if (distance < 1.42) {
      const pull = (1.42 - distance) * bodyScale * 0.012 * stagePower;
      lens.freeVx -= (nx / Math.max(0.001, distance)) * pull * dt;
      lens.freeVy -= (ny / Math.max(0.001, distance)) * pull * dt;
    }
  }

  function applyFloatingHandFlow(lens, bodyScale, dt, stagePower) {
    const leftWrist = getPosePoint(POSE_LANDMARKS.leftWrist);
    const rightWrist = getPosePoint(POSE_LANDMARKS.rightWrist);
    const flowRadius = bodyScale * 0.22;

    applySingleHandFlow(lens, leftWrist, -1, bodyScale, flowRadius, dt, stagePower);
    applySingleHandFlow(lens, rightWrist, 1, bodyScale, flowRadius, dt, stagePower);
  }

  function applySingleHandFlow(lens, wrist, tangentDirection, bodyScale, flowRadius, dt, stagePower) {
    if (!wrist) return;

    const dx = lens.freeX - wrist.x;
    const dy = lens.freeY - wrist.y;
    const distance = Math.hypot(dx, dy);
    if (distance > flowRadius || distance < 0.001) return;

    const influence = (1 - distance / flowRadius) * lens.freeBodyFlow * stagePower;
    const swirlX = -dy / distance * tangentDirection;
    const swirlY = dx / distance * tangentDirection;
    const outwardX = dx / distance;
    const outwardY = dy / distance;
    const motionPushX = latestPoseVelocity.x * 0.18;
    const motionPushY = latestPoseVelocity.y * 0.18;

    lens.freeVx += (swirlX * bodyScale * 0.032 + outwardX * bodyScale * 0.018 + motionPushX) * influence * dt;
    lens.freeVy += (swirlY * bodyScale * 0.032 + outwardY * bodyScale * 0.018 + motionPushY) * influence * dt;
  }

  function offsetLensAnchor(anchor, guide, bounds) {
    const handProjection = getHandLensProjection(guide, bounds);
    return {
      x: clamp(anchor.x + (guide.offsetU || 0) * bounds.width + handProjection.x, bounds.x - bounds.width * 0.26, bounds.x + bounds.width * 1.26),
      y: clamp(anchor.y + (guide.offsetV || 0) * bounds.height + handProjection.y, bounds.y - bounds.height * 0.22, bounds.y + bounds.height * 1.24),
      angle: anchor.angle
    };
  }

  function getHandLensProjection(guide, bounds) {
    const name = guide.name || "";
    const isLeft = guide.points && guide.points.length === 1 && guide.points[0] === POSE_LANDMARKS.leftWrist;
    const isRight = guide.points && guide.points.length === 1 && guide.points[0] === POSE_LANDMARKS.rightWrist;
    const isHandGuide = /hand|wrist|finger|fingertip|palm|knuckle|thumb|index|ring|little/.test(name);

    if (!isHandGuide || (!isLeft && !isRight)) return { x: 0, y: 0 };

    const wrist = getPosePoint(isLeft ? POSE_LANDMARKS.leftWrist : POSE_LANDMARKS.rightWrist);
    const elbow = getPosePoint(isLeft ? POSE_LANDMARKS.leftElbow : POSE_LANDMARKS.rightElbow);
    if (!wrist || !elbow) return { x: 0, y: 0 };

    let dirX = wrist.x - elbow.x;
    let dirY = wrist.y - elbow.y;
    const length = Math.hypot(dirX, dirY);
    if (length < 4) return { x: 0, y: 0 };

    dirX /= length;
    dirY /= length;

    const tangentX = -dirY;
    const tangentY = dirX;
    const reachSeed = hash2(name.length, guide.type || 0, 1493);
    let reachScale = 0.22;

    if (/fingertip/.test(name)) {
      reachScale = 1.05;
    } else if (/finger|thumb|index|ring|little/.test(name)) {
      reachScale = 0.82;
    } else if (/knuckle|palm/.test(name)) {
      reachScale = 0.48;
    } else if (/hand-nano/.test(name)) {
      reachScale = 0.64;
    } else if (/wrist/.test(name)) {
      reachScale = 0.22;
    }

    const outward = bounds.width * lerp(0.018, 0.062, reachSeed) * reachScale;
    const lateral = bounds.width * lerp(-0.018, 0.018, hash2(name.length + 9, guide.type || 0, 1511))
      + (guide.offsetV || 0) * bounds.height * 0.18;

    return {
      x: dirX * outward + tangentX * lateral,
      y: dirY * outward + tangentY * lateral
    };
  }

  function getFallbackLensAnchor(guide, bounds) {
    const safeBounds = bounds || { x: 0, y: 0, width: canvas.width || 1, height: canvas.height || 1 };
    return {
      x: safeBounds.x + safeBounds.width * guide.u,
      y: safeBounds.y + safeBounds.height * guide.v,
      angle: 0
    };
  }

  function setLensCanvasSize(targetCanvas, targetCtx, width, height) {
    if (targetCanvas.width !== width || targetCanvas.height !== height) {
      targetCanvas.width = width;
      targetCanvas.height = height;
      targetCtx.imageSmoothingEnabled = true;
      targetCtx.imageSmoothingQuality = "high";
    }
  }

  function hasUsableSourcePixels(data) {
    const step = Math.max(4, Math.floor(data.length / 120));
    let visibleSamples = 0;

    for (let index = 0; index < data.length; index += step - (step % 4)) {
      if (data[index] + data[index + 1] + data[index + 2] > 12) {
        visibleSamples += 1;
        if (visibleSamples > 6) return true;
      }
    }

    return false;
  }

  function writeBilinearSample(data, width, height, x, y, outputData, outputIndex) {
    const x0 = Math.floor(x);
    const y0 = Math.floor(y);
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const tx = x - x0;
    const ty = y - y0;
    const i00 = (y0 * width + x0) * 4;
    const i10 = (y0 * width + x1) * 4;
    const i01 = (y1 * width + x0) * 4;
    const i11 = (y1 * width + x1) * 4;
    const topWeight = 1 - ty;
    const bottomWeight = ty;
    const leftWeight = 1 - tx;
    const rightWeight = tx;
    const w00 = leftWeight * topWeight;
    const w10 = rightWeight * topWeight;
    const w01 = leftWeight * bottomWeight;
    const w11 = rightWeight * bottomWeight;

    outputData[outputIndex] = data[i00] * w00 + data[i10] * w10 + data[i01] * w01 + data[i11] * w11;
    outputData[outputIndex + 1] = data[i00 + 1] * w00 + data[i10 + 1] * w10 + data[i01 + 1] * w01 + data[i11 + 1] * w11;
    outputData[outputIndex + 2] = data[i00 + 2] * w00 + data[i10 + 2] * w10 + data[i01 + 2] * w01 + data[i11 + 2] * w11;
  }

  function writeSoftLensSample(data, width, height, x, y, radius, outputData, outputIndex) {
    let totalR = 0;
    let totalG = 0;
    let totalB = 0;
    let totalWeight = 0;
    const offsets = [
      [0, 0, 1.8],
      [radius, 0, 0.62],
      [-radius, 0, 0.62],
      [0, radius, 0.62],
      [0, -radius, 0.62],
      [radius * 0.7, radius * 0.7, 0.32],
      [-radius * 0.7, -radius * 0.7, 0.32]
    ];

    offsets.forEach((offset) => {
      const sample = getBilinearSample(data, width, height, x + offset[0], y + offset[1]);
      totalR += sample.r * offset[2];
      totalG += sample.g * offset[2];
      totalB += sample.b * offset[2];
      totalWeight += offset[2];
    });

    outputData[outputIndex] = totalR / totalWeight;
    outputData[outputIndex + 1] = totalG / totalWeight;
    outputData[outputIndex + 2] = totalB / totalWeight;
  }

  function getBilinearSample(data, width, height, x, y) {
    const safeX = clamp(x, 0, width - 1);
    const safeY = clamp(y, 0, height - 1);
    const x0 = Math.floor(safeX);
    const y0 = Math.floor(safeY);
    const x1 = Math.min(width - 1, x0 + 1);
    const y1 = Math.min(height - 1, y0 + 1);
    const tx = safeX - x0;
    const ty = safeY - y0;
    const i00 = (y0 * width + x0) * 4;
    const i10 = (y0 * width + x1) * 4;
    const i01 = (y1 * width + x0) * 4;
    const i11 = (y1 * width + x1) * 4;
    const w00 = (1 - tx) * (1 - ty);
    const w10 = tx * (1 - ty);
    const w01 = (1 - tx) * ty;
    const w11 = tx * ty;

    return {
      r: data[i00] * w00 + data[i10] * w10 + data[i01] * w01 + data[i11] * w11,
      g: data[i00 + 1] * w00 + data[i10 + 1] * w10 + data[i01 + 1] * w01 + data[i11 + 1] * w11,
      b: data[i00 + 2] * w00 + data[i10 + 2] * w10 + data[i01 + 2] * w01 + data[i11 + 2] * w11
    };
  }

  function updateAudioFromPose(now, progress) {
    const left = getHandHeight("left");
    const right = getHandHeight("right");
    const motion = clamp(latestPoseMotion / 42, 0, 1);

    setAudioTargets(left, right, motion, now);
    updateAudio(now, progress);
  }

  function setAudioTargets(left, right, motion, now) {
    audioTargetLeft = clamp(left, 0, 1);
    audioTargetRight = clamp(right, 0, 1);
    audioTargetMotion = clamp(motion, 0, 1);
    updateAudio(now, latestProgress);
  }

  function updateAudio(now, progress) {
    if (!audioContext || !audioNodes) return;

    const dt = audioLastUpdateAt
      ? clamp((now - audioLastUpdateAt) / 1000, 0.001, 0.25)
      : 0.016;
    audioLastUpdateAt = now;

    const handBlend = 1 - Math.exp(-dt / SIDE2_HAND_SMOOTHING_SECONDS);
    const movementBlend = 1 - Math.exp(-dt / SIDE2_MOVEMENT_SMOOTHING_SECONDS);

    audioLeft = lerp(audioLeft, bodyIsPresent ? audioTargetLeft : 0, handBlend);
    audioRight = lerp(audioRight, bodyIsPresent ? audioTargetRight : 0, handBlend);
    audioMotion = lerp(audioMotion, bodyIsPresent ? audioTargetMotion : 0, movementBlend);

    const stageLimit = bodyIsPresent ? SIDE2_STAGE_MAX_AUDIO[getStage(progress)] : 0;
    const echo = smoothstep(0.04, 1, audioLeft) * stageLimit;
    const volume = smoothstep(0.04, 1, audioRight) * stageLimit;
    const time = audioContext.currentTime;
    const presence = SIDE2_AUDIO_MASTER_VOLUME * (SIDE2_AUDIO_BASE_PRESENCE * stageLimit + Math.pow(volume, 1.24) * SIDE2_AUDIO_VOLUME_INTENSITY);

    audioNodes.master.gain.setTargetAtTime(presence, time, 0.22);
    audioNodes.lowPresence.gain.setTargetAtTime(1, time, 0.24);
    audioNodes.droneGain.gain.setTargetAtTime(0.014 * stageLimit * (0.68 + echo * 0.32), time, 0.66);
    audioNodes.drone.frequency.setTargetAtTime(lerp(SIDE2_AUDIO_LOW_FREQUENCY, SIDE2_AUDIO_HIGH_FREQUENCY, echo * 0.18), time, 0.56);
    audioNodes.lowFilter.frequency.setTargetAtTime(lerp(115, 280, echo), time, 0.38);
    audioNodes.resonator.frequency.setTargetAtTime(lerp(72, 168, echo), time, 0.4);
    audioNodes.resonator.Q.setTargetAtTime(lerp(3.2, 10.5, echo), time, 0.42);
    audioNodes.delay.delayTime.setTargetAtTime(lerp(SIDE2_AUDIO_DELAY_LOW, SIDE2_AUDIO_DELAY_HIGH, echo), time, 0.56);
    audioNodes.feedback.gain.setTargetAtTime(lerp(SIDE2_AUDIO_FEEDBACK_LOW, SIDE2_AUDIO_FEEDBACK_HIGH, echo), time, 0.56);
    audioNodes.wet.gain.setTargetAtTime(lerp(0.04, 0.42, echo), time, 0.5);

    if (!bodyIsPresent || stageLimit <= 0.001) {
      nextImpactAt = 0;
      return;
    }

    if (audioStarted && now >= nextImpactAt) {
      triggerLiquidImpact(echo, volume, now);
      scheduleNextImpact(now);
    }
  }

  function triggerLiquidImpact(echo, volume, now) {
    if (!audioContext || !audioNodes) return;

    const time = audioContext.currentTime;
    const low = audioContext.createOscillator();
    const sub = audioContext.createOscillator();
    const resonance = audioContext.createOscillator();
    const lowGain = audioContext.createGain();
    const subGain = audioContext.createGain();
    const resonanceGain = audioContext.createGain();
    const frequency = lerp(32, 48, hash1(now, 1103));
    const resonanceFrequency = frequency * lerp(2.35, 3.65, hash1(now, 1117));
    const decay = lerp(SIDE2_AUDIO_DECAY_LOW, SIDE2_AUDIO_DECAY_HIGH, echo);
    const weight = SIDE2_AUDIO_DROP_GAIN * lerp(0.78, 1.04, volume);
    const attack = lerp(0.055, 0.095, hash1(now, 1129));

    low.type = "sine";
    sub.type = "sine";
    resonance.type = "sine";
    low.frequency.setValueAtTime(frequency, time);
    low.frequency.exponentialRampToValueAtTime(Math.max(22, frequency * 0.56), time + decay * 0.9);
    sub.frequency.setValueAtTime(frequency * 0.5, time);
    sub.frequency.exponentialRampToValueAtTime(Math.max(16, frequency * 0.32), time + decay * 0.95);
    resonance.frequency.setValueAtTime(resonanceFrequency, time);
    resonance.frequency.exponentialRampToValueAtTime(Math.max(58, resonanceFrequency * 0.72), time + decay * 0.78);

    lowGain.gain.setValueAtTime(0.0001, time);
    lowGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, weight), time + attack);
    lowGain.gain.exponentialRampToValueAtTime(0.0001, time + decay);
    subGain.gain.setValueAtTime(0.0001, time);
    subGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, weight * 0.46), time + attack * 1.35);
    subGain.gain.exponentialRampToValueAtTime(0.0001, time + decay * 1.08);
    resonanceGain.gain.setValueAtTime(0.0001, time);
    resonanceGain.gain.exponentialRampToValueAtTime(Math.max(0.0002, SIDE2_AUDIO_RESONANCE_GAIN * lerp(0.3, 1.05, echo) * weight), time + attack * 0.82);
    resonanceGain.gain.exponentialRampToValueAtTime(0.0001, time + decay * lerp(0.72, 1.24, echo));

    low.connect(lowGain);
    sub.connect(subGain);
    resonance.connect(resonanceGain);
    lowGain.connect(audioNodes.lowFilter);
    subGain.connect(audioNodes.lowFilter);
    resonanceGain.connect(audioNodes.resonator);
    low.start(time);
    sub.start(time);
    resonance.start(time);
    low.stop(time + decay + 0.2);
    sub.stop(time + decay + 0.2);
    resonance.stop(time + decay + 0.2);
    triggerAudioVisualPulse(volume, echo, now);
  }

  function scheduleNextImpact(now) {
    if (!nextImpactAt) {
      nextImpactAt = now + SIDE2_AUDIO_PULSE_INTERVAL;
      return;
    }

    nextImpactAt += SIDE2_AUDIO_PULSE_INTERVAL;
    if (nextImpactAt <= now) {
      nextImpactAt = now + SIDE2_AUDIO_PULSE_INTERVAL;
    }
  }

  function triggerAudioVisualPulse(volume, echo, now) {
    side2AudioVisualPulse = clamp(side2AudioVisualPulse + 0.22 + volume * 0.32 + echo * 0.12, 0, 1);
    side2AudioVisualPulseAt = now;
  }

  function getAudioVisualPulse(now) {
    if (!Number.isFinite(side2AudioVisualPulseAt)) return 0;

    const age = Math.max(0, now - side2AudioVisualPulseAt);
    const envelope = Math.exp(-age / SIDE2_AUDIO_VISUAL_PULSE_DECAY_MS);
    side2AudioVisualPulse *= Math.exp(-Math.min(age, 80) / (SIDE2_AUDIO_VISUAL_PULSE_DECAY_MS * 1.6));
    return side2AudioVisualPulse * envelope;
  }

  function getHandHeight(side) {
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

    return smoothstep(0.04, 0.96, clamp((lowY - wrist.y) / range, 0, 1));
  }

  function getPosePoint(index) {
    if (!latestPosePoints) return null;
    const point = latestPosePoints[index];
    return isVisiblePosePoint(point) ? point : null;
  }

  function calculateMaskCoverage(maskPixels) {
    const data = maskPixels.data;
    let covered = 0;
    let minX = SIDE2_MASK_SAMPLE_SIZE;
    let minY = SIDE2_MASK_SAMPLE_SIZE;
    let maxX = -1;
    let maxY = -1;

    for (let index = 0; index < data.length; index += 4) {
      if (data[index] / 255 > 0.42) {
        const pixelIndex = index / 4;
        const x = pixelIndex % SIDE2_MASK_SAMPLE_SIZE;
        const y = Math.floor(pixelIndex / SIDE2_MASK_SAMPLE_SIZE);

        covered += 1;
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    currentMaskBounds = covered
      ? constrainMaskBoundsToPose({ minX, minY, maxX, maxY })
      : null;

    return covered / (SIDE2_MASK_SAMPLE_SIZE * SIDE2_MASK_SAMPLE_SIZE);
  }

  function constrainMaskBoundsToPose(maskBounds) {
    const poseBounds = getPoseGuidedSampleBounds();
    if (!poseBounds) return maskBounds;

    const constrained = {
      minX: Math.max(maskBounds.minX, poseBounds.minX),
      minY: Math.max(maskBounds.minY, poseBounds.minY),
      maxX: Math.min(maskBounds.maxX, poseBounds.maxX),
      maxY: Math.min(maskBounds.maxY, poseBounds.maxY)
    };

    if (constrained.maxX <= constrained.minX || constrained.maxY <= constrained.minY) {
      return maskBounds;
    }

    const maskArea = Math.max(1, (maskBounds.maxX - maskBounds.minX + 1) * (maskBounds.maxY - maskBounds.minY + 1));
    const constrainedArea = Math.max(1, (constrained.maxX - constrained.minX + 1) * (constrained.maxY - constrained.minY + 1));
    const poseArea = Math.max(1, (poseBounds.maxX - poseBounds.minX + 1) * (poseBounds.maxY - poseBounds.minY + 1));

    if (constrainedArea < maskArea * 0.16 && maskArea < poseArea * 1.24) {
      return maskBounds;
    }

    return constrained;
  }

  function getPoseGuidedSampleBounds() {
    if (!latestPosePoints || latestVisiblePoseCount < SIDE2_MASK_POSE_GUIDE_MIN_POINTS) return null;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    let count = 0;

    STRUCTURE_LANDMARKS.forEach((index) => {
      const point = getPosePoint(index);
      if (!point) return;

      const sampleX = clamp(point.x / Math.max(1, canvas.width) * SIDE2_MASK_SAMPLE_SIZE, 0, SIDE2_MASK_SAMPLE_SIZE - 1);
      const sampleY = clamp(point.y / Math.max(1, canvas.height) * SIDE2_MASK_SAMPLE_SIZE, 0, SIDE2_MASK_SAMPLE_SIZE - 1);
      minX = Math.min(minX, sampleX);
      minY = Math.min(minY, sampleY);
      maxX = Math.max(maxX, sampleX);
      maxY = Math.max(maxY, sampleY);
      count += 1;
    });

    if (count < SIDE2_MASK_POSE_GUIDE_MIN_POINTS) return null;

    const width = Math.max(4, maxX - minX);
    const height = Math.max(8, maxY - minY);
    const paddingX = clamp(width * SIDE2_MASK_POSE_GUIDE_PADDING_X, 7, 24);
    const paddingY = clamp(height * SIDE2_MASK_POSE_GUIDE_PADDING_Y, 8, 24);

    return {
      minX: clamp(Math.floor(minX - paddingX), 0, SIDE2_MASK_SAMPLE_SIZE - 1),
      minY: clamp(Math.floor(minY - paddingY), 0, SIDE2_MASK_SAMPLE_SIZE - 1),
      maxX: clamp(Math.ceil(maxX + paddingX), 0, SIDE2_MASK_SAMPLE_SIZE - 1),
      maxY: clamp(Math.ceil(maxY + paddingY), 0, SIDE2_MASK_SAMPLE_SIZE - 1)
    };
  }

  function getLocalEffectBounds(extraMargin) {
    const bounds = stableMaskBounds || currentMaskBounds;
    if (!bounds || !canvas.width || !canvas.height) return null;

    const scaleX = canvas.width / SIDE2_MASK_SAMPLE_SIZE;
    const scaleY = canvas.height / SIDE2_MASK_SAMPLE_SIZE;
    const minX = bounds.minX * scaleX;
    const minY = bounds.minY * scaleY;
    const maxX = (bounds.maxX + 1) * scaleX;
    const maxY = (bounds.maxY + 1) * scaleY;
    const margin = Math.max(0, extraMargin || 0);
    const x = clamp(minX - margin, 0, canvas.width);
    const y = clamp(minY - margin, 0, canvas.height);
    const right = clamp(maxX + margin, 0, canvas.width);
    const bottom = clamp(maxY + margin, 0, canvas.height);

    return {
      x,
      y,
      width: Math.max(1, right - x),
      height: Math.max(1, bottom - y)
    };
  }

  function getFieldEffectBounds() {
    return {
      x: 0,
      y: 0,
      width: Math.max(1, canvas.width || 1),
      height: Math.max(1, canvas.height || 1)
    };
  }

  function getBodyEffectBounds() {
    const bounds = stableMaskBounds || currentMaskBounds;
    if (!bounds || !canvas.width || !canvas.height) return null;

    const scaleX = canvas.width / SIDE2_MASK_SAMPLE_SIZE;
    const scaleY = canvas.height / SIDE2_MASK_SAMPLE_SIZE;
    const minX = clamp(bounds.minX * scaleX, 0, canvas.width);
    const minY = clamp(bounds.minY * scaleY, 0, canvas.height);
    const maxX = clamp((bounds.maxX + 1) * scaleX, 0, canvas.width);
    const maxY = clamp((bounds.maxY + 1) * scaleY, 0, canvas.height);

    return {
      x: minX,
      y: minY,
      width: Math.max(1, maxX - minX),
      height: Math.max(1, maxY - minY)
    };
  }

  function getCanvasMaskValue(x, y) {
    if (!latestMaskPixels || !canvas.width || !canvas.height) return 0;

    const sampleX = clamp((x / canvas.width) * (SIDE2_MASK_SAMPLE_SIZE - 1), 0, SIDE2_MASK_SAMPLE_SIZE - 1);
    const sampleY = clamp((y / canvas.height) * (SIDE2_MASK_SAMPLE_SIZE - 1), 0, SIDE2_MASK_SAMPLE_SIZE - 1);
    const x0 = Math.floor(sampleX);
    const y0 = Math.floor(sampleY);
    const x1 = Math.min(SIDE2_MASK_SAMPLE_SIZE - 1, x0 + 1);
    const y1 = Math.min(SIDE2_MASK_SAMPLE_SIZE - 1, y0 + 1);
    const tx = sampleX - x0;
    const ty = sampleY - y0;
    const data = latestMaskPixels.data;
    const topLeft = (y0 * SIDE2_MASK_SAMPLE_SIZE + x0) * 4;
    const topRight = (y0 * SIDE2_MASK_SAMPLE_SIZE + x1) * 4;
    const bottomLeft = (y1 * SIDE2_MASK_SAMPLE_SIZE + x0) * 4;
    const bottomRight = (y1 * SIDE2_MASK_SAMPLE_SIZE + x1) * 4;
    const top = lerp(data[topLeft] / 255, data[topRight] / 255, tx);
    const bottom = lerp(data[bottomLeft] / 255, data[bottomRight] / 255, tx);

    return lerp(top, bottom, ty);
  }

  function calculatePoseMotion(currentPoints, previousPoints) {
    if (!currentPoints || !previousPoints) return latestPoseMotion * 0.82;

    let total = 0;
    let count = 0;

    STRUCTURE_LANDMARKS.forEach((index) => {
      const current = currentPoints[index];
      const previous = previousPoints[index];
      if (!isVisiblePosePoint(current) || !isVisiblePosePoint(previous)) return;
      total += Math.hypot(current.x - previous.x, current.y - previous.y);
      count += 1;
    });

    if (!count) return latestPoseMotion * 0.82;

    return latestPoseMotion * 0.82 + (total / count) * 0.18;
  }

  function calculatePoseVelocity(currentPoints, previousPoints) {
    if (!currentPoints || !previousPoints) {
      return {
        x: latestPoseVelocity.x * 0.88,
        y: latestPoseVelocity.y * 0.88
      };
    }

    let totalX = 0;
    let totalY = 0;
    let count = 0;

    STRUCTURE_LANDMARKS.forEach((index) => {
      const current = currentPoints[index];
      const previous = previousPoints[index];
      if (!isVisiblePosePoint(current) || !isVisiblePosePoint(previous)) return;
      totalX += current.x - previous.x;
      totalY += current.y - previous.y;
      count += 1;
    });

    if (!count) {
      return {
        x: latestPoseVelocity.x * 0.88,
        y: latestPoseVelocity.y * 0.88
      };
    }

    return {
      x: latestPoseVelocity.x * 0.86 + (totalX / count) * 0.14,
      y: latestPoseVelocity.y * 0.86 + (totalY / count) * 0.14
    };
  }

  function poseLandmarkToCanvasPoint(landmark, index) {
    if (!video.videoWidth || !video.videoHeight || !canvas.width || !canvas.height) {
      return { x: 0, y: 0, z: landmark.z || 0, visibility: landmark.visibility ?? 0, index };
    }

    const rect = coverSourceRect(video.videoWidth, video.videoHeight, canvas.width, canvas.height);
    const sourceX = landmark.x * video.videoWidth;
    const sourceY = landmark.y * video.videoHeight;

    return {
      x: ((sourceX - rect.sx) / rect.sw) * canvas.width,
      y: ((sourceY - rect.sy) / rect.sh) * canvas.height,
      z: landmark.z || 0,
      visibility: landmark.visibility ?? 1,
      index
    };
  }

  function isVisiblePosePoint(point) {
    return Boolean(
      point
        && Number.isFinite(point.x)
        && Number.isFinite(point.y)
        && point.visibility >= SIDE2_LANDMARK_CONFIDENCE
        && point.x > -80
        && point.x < canvas.width + 80
        && point.y > -80
        && point.y < canvas.height + 80
    );
  }

  function getTransformationProgress(now) {
    if (!transformationStartTime) transformationStartTime = now;

    const elapsed = now - transformationStartTime;
    const duration = Math.max(1, SIDE2_FINAL_TRANSFORMATION_TIME - SIDE2_START_TRANSFORMATION_TIME);

    return clamp((elapsed - SIDE2_START_TRANSFORMATION_TIME) / duration, 0, 1);
  }

  function getStage(progress) {
    if (progress < 0.2) return 1;
    if (progress < 0.4) return 2;
    if (progress < 0.6) return 3;
    if (progress < 0.82) return 4;
    return 5;
  }

  function getManualStageProgress(stage) {
    if (stage === 1) return 0.08;
    if (stage === 2) return 0.28;
    if (stage === 3) return 0.52;
    if (stage === 4) return 0.76;
    return 0.97;
  }

  function handleKeyboard(event) {
    if (!running) return;

    if (["1", "2", "3", "4", "5"].includes(event.key)) {
      manualStage = Number(event.key);
    }

    if (event.key.toLowerCase() === "r") {
      manualStage = null;
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

  function getSide2MaxRenderWidth() {
    if (!isMobilePerformanceProfile()) return SIDE2_MAX_RENDER_WIDTH;
    return isTabletPerformanceProfile() ? SIDE2_MOBILE_TABLET_MAX_RENDER_WIDTH : SIDE2_MOBILE_MAX_RENDER_WIDTH;
  }

  function getSide2MaxRenderHeight() {
    if (!isMobilePerformanceProfile()) return SIDE2_MAX_RENDER_HEIGHT;
    return isTabletPerformanceProfile() ? SIDE2_MOBILE_TABLET_MAX_RENDER_HEIGHT : SIDE2_MOBILE_MAX_RENDER_HEIGHT;
  }

  function getSide2SegmentationInterval() {
    return isMobilePerformanceProfile() ? SIDE2_MOBILE_SEGMENTATION_INTERVAL_MS : 0;
  }

  function getSide2InitialLensQuality() {
    return isMobilePerformanceProfile() ? SIDE2_LENS_MOBILE_INITIAL_QUALITY : 0.88;
  }

  function getSide2MinLensQuality() {
    return isMobilePerformanceProfile() ? SIDE2_LENS_MOBILE_MIN_QUALITY_SCALE : SIDE2_LENS_MIN_QUALITY_SCALE;
  }

  function getSide2LensRenderMaxWidth() {
    return isMobilePerformanceProfile() ? SIDE2_LENS_MOBILE_MAX_WIDTH : SIDE2_LENS_MAX_WIDTH;
  }

  function getSide2LensRenderMaxHeight() {
    return isMobilePerformanceProfile() ? SIDE2_LENS_MOBILE_MAX_HEIGHT : SIDE2_LENS_MAX_HEIGHT;
  }

  function getSide2LensCreateBatchSize() {
    return isMobilePerformanceProfile() ? Math.max(48, Math.round(SIDE2_LENS_CREATE_BATCH_SIZE * 0.52)) : SIDE2_LENS_CREATE_BATCH_SIZE;
  }

  function resizeRenderer() {
    if (!canvas) return;

    const viewportWidth = Math.max(1, window.innerWidth || document.documentElement.clientWidth || 1);
    const viewportHeight = Math.max(1, window.innerHeight || document.documentElement.clientHeight || 1);
    const pixelRatio = Math.min(window.devicePixelRatio || 1, SIDE2_MAX_DEVICE_PIXEL_RATIO);
    const scale = Math.min(
      1,
      getSide2MaxRenderWidth() / Math.max(1, viewportWidth * pixelRatio),
      getSide2MaxRenderHeight() / Math.max(1, viewportHeight * pixelRatio)
    );
    const width = Math.max(1, Math.round(viewportWidth * pixelRatio * scale));
    const height = Math.max(1, Math.round(viewportHeight * pixelRatio * scale));

    if (canvas.width === width && canvas.height === height) return;

    [canvas, maskCanvas, stableMaskCanvas, stableMaskBufferCanvas, currentCanvas, lensMaskCanvas].forEach((target) => {
      target.width = width;
      target.height = height;
    });

    ctx.imageSmoothingEnabled = true;
    currentCtx.imageSmoothingEnabled = true;
    stableMaskCtx.imageSmoothingEnabled = true;
    stableMaskBufferCtx.imageSmoothingEnabled = true;
    lensMaskCtx.imageSmoothingEnabled = true;
    stableMaskCtx.clearRect(0, 0, width, height);
    stableMaskBufferCtx.clearRect(0, 0, width, height);
    stableMaskReady = false;
    stableMaskBounds = null;
    lastStableMaskSeenAt = 0;
    side2Lenses = [];
    side2LensQuality = getSide2InitialLensQuality();
    side2LensOutputPixels = null;
    side2LensOutputWidth = 0;
    side2LensOutputHeight = 0;
    side2LensLookupWidth = 0;
    side2LensLookupHeight = 0;
    side2LensLookupBinSize = 0;
    side2LensInteractionCursor = 0;
    side2LensNextInteractionAt = 0;
    side2DrawableLensCount = 0;
    nextImpactAt = 0;
    side2AudioVisualPulse = 0;
    side2AudioVisualPulseAt = -Infinity;
    resetLensBubbles();
    resetOutwardEmissionFragments();
    resetLensGlitchState();
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

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function lerp(start, end, amount) {
    return start + (end - start) * amount;
  }

  function lerpAngle(start, end, amount) {
    const difference = Math.atan2(Math.sin(end - start), Math.cos(end - start));
    return start + difference * amount;
  }

  function smoothstep(edge0, edge1, value) {
    if (edge0 === edge1) return value < edge0 ? 0 : 1;
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function hash1(value, salt = 0) {
    const n = Math.sin(value * 127.1 + salt * 311.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function hash2(x, y, salt = 0) {
    const n = Math.sin(x * 127.1 + y * 311.7 + salt * 74.7) * 43758.5453123;
    return n - Math.floor(n);
  }

  function wait(ms) {
    return new Promise((resolve) => window.setTimeout(resolve, ms));
  }

  function nextAnimationFrame() {
    return new Promise((resolve) => window.requestAnimationFrame(resolve));
  }

  window.Side2Fluid = {
    start,
    primeAudio,
    stop
  };
}());
