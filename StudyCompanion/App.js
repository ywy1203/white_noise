import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  PanResponder,
  Animated,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { Video } from 'expo-av';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';
import CryptoJS from 'crypto-js';

// ── Tencent Cloud COS presigned URL helper ────────────────────────
const COS_BUCKET = 'yxh-1446431912';
const COS_REGION = 'ap-guangzhou';
const COS_SECRET_ID = process.env.COS_SECRET_ID || '';
const COS_SECRET_KEY = process.env.COS_SECRET_KEY || '';
const COS_BASE = `https://${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com`;

function getPresignedUrl(key, expiresSec = 3600) {
  const now = Math.floor(Date.now() / 1000);
  const start = now - 60;
  const end = now + expiresSec;
  const keyTime = `${start};${end}`;
  const signKey = CryptoJS.HmacSHA1(keyTime, COS_SECRET_KEY).toString(CryptoJS.enc.Hex);

  const httpString = `get\n/${key}\n\nhost=${COS_BUCKET}.cos.${COS_REGION}.myqcloud.com\n`;
  const sha1Http = CryptoJS.SHA1(httpString).toString(CryptoJS.enc.Hex);
  const stringToSign = `sha1\n${keyTime}\n${sha1Http}\n`;
  const signature = CryptoJS.HmacSHA1(stringToSign, signKey).toString(CryptoJS.enc.Hex);

  const params = [
    `q-sign-algorithm=sha1`,
    `q-ak=${encodeURIComponent(COS_SECRET_ID)}`,
    `q-sign-time=${keyTime}`,
    `q-key-time=${keyTime}`,
    `q-header-list=host`,
    `q-url-param-list=`,
    `q-signature=${signature}`,
  ].join('&');
  return `${COS_BASE}/${key}?${params}`;
}

// ── Scene definitions ─────────────────────────────────────────────
const SCENE_DEFS = [
  { key: 'fireplace', icon: '\uD83D\uDD25', label: '壁炉', uriFunc: () => getPresignedUrl('videos/fireplace.mp4') },
  { key: 'rain',     icon: '\u2614', label: '下雨', uriFunc: () => getPresignedUrl('videos/rain.mp4') },
  { key: 'forest',   icon: '\uD83C\uDF33', label: '森林', uriFunc: () => getPresignedUrl('videos/forest.mp4') },
];

const COUNTDOWN_PRESETS = [25, 45, 90];

const STORAGE_KEYS = {
  SCENE_INDEX: '@scene_index',
  TIMER_MODE: '@timer_mode',
  COUNTDOWN_MINUTES: '@countdown_minutes',
  IS_MUTED: '@is_muted',
};

const MODE_CLOCK    = 'clock';
const MODE_COUNTUP  = 'countup';
const MODE_COUNTDOWN = 'countdown';

// ── Helpers ───────────────────────────────────────────────────────
const getCurrentTimeString = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

const fmt = (s) =>
  `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

// ── Main App ──────────────────────────────────────────────────────
export default function App() {
  // Video assets (loaded asynchronously)
  const [scenes, setScenes] = useState(null);
  const [assetsReady, setAssetsReady] = useState(false);

  // UI state
  const [sceneIndex, setSceneIndex] = useState(0);
  const [timerMode, setTimerMode] = useState(MODE_CLOCK);
  const [countdownMinutes, setCountdownMinutes] = useState(COUNTDOWN_PRESETS[0]);
  const [isMuted, setIsMuted] = useState(true);
  const [controlsVisible, setControlsVisible] = useState(true);
  const [currentTimeStr, setCurrentTimeStr] = useState(getCurrentTimeString());

  // Timer state
  const [countupSeconds, setCountupSeconds] = useState(0);
  const [countdownSeconds, setCountdownSeconds] = useState(countdownMinutes * 60);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  // Transition state
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const [displaySceneIndex, setDisplaySceneIndex] = useState(0);

  // Refs
  const clockInterval = useRef(null);
  const timerInterval = useRef(null);
  const hideTimeout = useRef(null);
  const videoRef = useRef(null);

  // ── Init scenes (cloud URLs, no loading needed) ──────────────
  useEffect(() => {
    setScenes(SCENE_DEFS);
    setAssetsReady(true);
  }, []);

  // ── Load preferences ──────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [savedScene, savedMode, savedMins, savedMuted] = await Promise.all([
          AsyncStorage.getItem(STORAGE_KEYS.SCENE_INDEX),
          AsyncStorage.getItem(STORAGE_KEYS.TIMER_MODE),
          AsyncStorage.getItem(STORAGE_KEYS.COUNTDOWN_MINUTES),
          AsyncStorage.getItem(STORAGE_KEYS.IS_MUTED),
        ]);
        if (savedScene !== null) {
          const idx = parseInt(savedScene, 10);
          if (idx >= 0 && idx < SCENE_DEFS.length) {
            setSceneIndex(idx);
            setDisplaySceneIndex(idx);
          }
        }
        if (savedMode !== null) setTimerMode(savedMode);
        if (savedMins !== null) {
          const mins = parseInt(savedMins, 10);
          setCountdownMinutes(mins);
          setCountdownSeconds(mins * 60);
        }
        if (savedMuted !== null) setIsMuted(savedMuted === 'true');
      } catch (_) {}
    })();
  }, []);

  // ── Lock landscape ────────────────────────────────────────────
  useEffect(() => {
    ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    StatusBar.setHidden(true);
    return () => { ScreenOrientation.unlockAsync(); };
  }, []);

  // ── Live clock tick ───────────────────────────────────────────
  useEffect(() => {
    clockInterval.current = setInterval(() => {
      setCurrentTimeStr(getCurrentTimeString());
    }, 1000);
    return () => clearInterval(clockInterval.current);
  }, []);

  // ── Timer tick (count-up / count-down) ────────────────────────
  useEffect(() => {
    if (!isTimerRunning) {
      if (timerInterval.current) clearInterval(timerInterval.current);
      return;
    }
    timerInterval.current = setInterval(() => {
      if (timerMode === MODE_COUNTUP) {
        setCountupSeconds((s) => s + 1);
      } else if (timerMode === MODE_COUNTDOWN) {
        setCountdownSeconds((s) => {
          if (s <= 1) {
            clearInterval(timerInterval.current);
            setIsTimerRunning(false);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Vibration.vibrate([500, 200, 500]);
            return 0;
          }
          return s - 1;
        });
      }
    }, 1000);
    return () => clearInterval(timerInterval.current);
  }, [isTimerRunning, timerMode]);

  // ── Auto-hide controls after 3s ───────────────────────────────
  const scheduleHide = useCallback(() => {
    if (hideTimeout.current) clearTimeout(hideTimeout.current);
    hideTimeout.current = setTimeout(() => setControlsVisible(false), 3000);
  }, []);

  useEffect(() => {
    if (controlsVisible) scheduleHide();
    return () => { if (hideTimeout.current) clearTimeout(hideTimeout.current); };
  }, [controlsVisible, scheduleHide]);

  // ── Persistence helper ────────────────────────────────────────
  const savePref = useCallback(async (key, value) => {
    try { await AsyncStorage.setItem(key, String(value)); } catch (_) {}
  }, []);

  // ── Scene transition (cross-fade) ─────────────────────────────
  const switchToScene = useCallback((newIndex) => {
    if (newIndex === sceneIndex) return;
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      setSceneIndex(newIndex);
      setDisplaySceneIndex(newIndex);
      savePref(STORAGE_KEYS.SCENE_INDEX, newIndex);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 250,
        useNativeDriver: true,
      }).start();
    });
  }, [sceneIndex, fadeAnim, savePref]);

  // ── Swipe gesture ─────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gs) =>
        Math.abs(gs.dx) > 40 && Math.abs(gs.dx) > Math.abs(gs.dy),
      onPanResponderRelease: (_, gs) => {
        if (gs.dx < -60 && sceneIndex < SCENE_DEFS.length - 1) {
          switchToScene(sceneIndex + 1);
        } else if (gs.dx > 60 && sceneIndex > 0) {
          switchToScene(sceneIndex - 1);
        }
      },
    })
  ).current;

  // ── Timer controls ────────────────────────────────────────────
  const cycleTimerMode = useCallback(() => {
    const order = [MODE_CLOCK, MODE_COUNTUP, MODE_COUNTDOWN];
    const idx = order.indexOf(timerMode);
    const next = order[(idx + 1) % order.length];
    setTimerMode(next);
    setIsTimerRunning(false);
    if (next === MODE_COUNTDOWN) setCountdownSeconds(countdownMinutes * 60);
    if (next === MODE_COUNTUP) setCountupSeconds(0);
    savePref(STORAGE_KEYS.TIMER_MODE, next);
  }, [timerMode, countdownMinutes, savePref]);

  const toggleTimer = useCallback(() => {
    if (timerMode === MODE_CLOCK) return;
    if (timerMode === MODE_COUNTDOWN && countdownSeconds === 0) {
      setCountdownSeconds(countdownMinutes * 60);
    }
    setIsTimerRunning((r) => !r);
  }, [timerMode, countdownSeconds, countdownMinutes]);

  const resetTimer = useCallback(() => {
    setIsTimerRunning(false);
    if (timerMode === MODE_COUNTUP) setCountupSeconds(0);
    if (timerMode === MODE_COUNTDOWN) setCountdownSeconds(countdownMinutes * 60);
  }, [timerMode, countdownMinutes]);

  const cycleCountdownPreset = useCallback(() => {
    const currentIdx = COUNTDOWN_PRESETS.indexOf(countdownMinutes);
    const nextIdx = (currentIdx + 1) % COUNTDOWN_PRESETS.length;
    const mins = COUNTDOWN_PRESETS[nextIdx];
    setCountdownMinutes(mins);
    setCountdownSeconds(mins * 60);
    setIsTimerRunning(false);
    savePref(STORAGE_KEYS.COUNTDOWN_MINUTES, mins);
  }, [countdownMinutes, savePref]);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      savePref(STORAGE_KEYS.IS_MUTED, next);
      return next;
    });
  }, [savePref]);

  const onVideoTap = useCallback(() => {
    setControlsVisible((v) => !v);
  }, []);

  // ── Loading screen ────────────────────────────────────────────
  if (!assetsReady || !scenes) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#fff" />
        <Text style={styles.loadingText}>加载中...</Text>
      </View>
    );
  }

  // ── Display helpers ───────────────────────────────────────────
  const scene = scenes[displaySceneIndex];

  const leftDisplay =
    timerMode === MODE_CLOCK
      ? currentTimeStr
      : timerMode === MODE_COUNTUP
        ? fmt(countupSeconds)
        : fmt(countdownSeconds);

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={styles.root} {...panResponder.panHandlers}>
      <StatusBar hidden={true} />

      {/* Video background */}
      <Animated.View style={[styles.videoContainer, { opacity: fadeAnim }]}>
        <Video
          ref={videoRef}
          source={{ uri: scene.uriFunc() }}
          style={styles.video}
          resizeMode="cover"
          shouldPlay
          isLooping
          isMuted={isMuted}
          rate={1.0}
        />
      </Animated.View>

      {/* Transparent tap area for showing/hiding controls */}
      <TouchableOpacity
        style={styles.tapArea}
        activeOpacity={1}
        onPress={onVideoTap}
      />

      {/* Top bar */}
      {controlsVisible && (
        <Animated.View style={styles.topBar}>
          <View style={styles.topBarInner}>
            {/* Scene switcher buttons */}
            <View style={styles.sceneButtons}>
              {scenes.map((s, i) => (
                <TouchableOpacity
                  key={s.key}
                  style={[styles.sceneBtn, i === sceneIndex && styles.sceneBtnActive]}
                  onPress={() => switchToScene(i)}
                >
                  <Text style={styles.sceneIcon}>{s.icon}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Center clock */}
            <Text style={styles.topClock}>{currentTimeStr}</Text>

            {/* Right: mute toggle */}
            <View style={styles.topRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={toggleMute}>
                <Text style={styles.iconText}>
                  {isMuted ? '\uD83D\uDD07' : '\uD83D\uDD0A'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      )}

      {/* Bottom bar */}
      {controlsVisible && (
        <Animated.View style={styles.bottomBar}>
          <View style={styles.bottomBarInner}>
            {/* Left: timer mode display (tap to cycle) */}
            <TouchableOpacity style={styles.bottomLeft} onPress={cycleTimerMode}>
              <Text style={styles.bottomModeLabel}>
                {timerMode === MODE_CLOCK
                  ? '\uD83D\uDD50 当前时间'
                  : timerMode === MODE_COUNTUP
                    ? '\u23F1\uFE0F 正计时'
                    : '\u23F3 倒计时'}
              </Text>
              <Text style={styles.bottomTimeText}>{leftDisplay}</Text>
            </TouchableOpacity>

            {/* Center: play/pause + reset */}
            <View style={styles.bottomCenter}>
              {timerMode !== MODE_CLOCK && (
                <>
                  <TouchableOpacity style={styles.controlBtn} onPress={toggleTimer}>
                    <Text style={styles.controlBtnText}>
                      {isTimerRunning ? '\u23F8' : '\u25B6'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.resetBtn} onPress={resetTimer}>
                    <Text style={styles.resetBtnText}>{'\u23F9'}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>

            {/* Right: countdown preset or focus duration */}
            <TouchableOpacity
              style={styles.bottomRight}
              onPress={timerMode === MODE_COUNTDOWN ? cycleCountdownPreset : undefined}
              disabled={timerMode !== MODE_COUNTDOWN}
            >
              {timerMode === MODE_COUNTDOWN && (
                <>
                  <Text style={styles.bottomModeLabel}>预设</Text>
                  <Text style={styles.bottomTimeText}>{countdownMinutes}min</Text>
                </>
              )}
              {timerMode === MODE_COUNTUP && (
                <>
                  <Text style={styles.bottomModeLabel}>专注时长</Text>
                  <Text style={styles.bottomTimeText}>{fmt(countupSeconds)}</Text>
                </>
              )}
              {timerMode === MODE_CLOCK && (
                <Text style={styles.bottomModeLabel}>点击切换到正计时</Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },

  // Loading
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    marginTop: 16,
  },

  // Video
  videoContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  video: {
    flex: 1,
  },
  tapArea: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },

  // Top bar
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  topBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sceneButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sceneBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sceneBtnActive: {
    backgroundColor: 'rgba(255,255,255,0.30)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.7)',
  },
  sceneIcon: {
    fontSize: 22,
  },
  topClock: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: 2,
  },
  topRight: {
    flexDirection: 'row',
    gap: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 20,
  },

  // Bottom bar
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingBottom: 16,
    paddingTop: 28,
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  bottomBarInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomLeft: {
    flex: 1,
    alignItems: 'flex-start',
  },
  bottomCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  bottomRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  bottomModeLabel: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 2,
  },
  bottomTimeText: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 1,
    fontVariant: ['tabular-nums'],
  },
  controlBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlBtnText: {
    fontSize: 24,
    color: '#fff',
  },
  resetBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetBtnText: {
    fontSize: 18,
    color: 'rgba(255,255,255,0.7)',
  },
});
