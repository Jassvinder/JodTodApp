import { useEffect, useState } from 'react';
import { Dimensions, Modal, Platform, StatusBar, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native';
import { Colors } from '../../constants/colors';
import { SCREEN_TIPS } from '../../constants/tips';
import { activeTip, useTipsStore } from '../../stores/tipsStore';

const BUBBLE_MAX_WIDTH = 320;
const BUBBLE_HEIGHT_ESTIMATE = 190;
const SPOTLIGHT_PADDING = 6;
const DIM = 'rgba(15, 23, 42, 0.6)';

// Global tip bubble with a spotlight around the anchored element. Mounted once in the root layout.
export default function TipsOverlay() {
  const { width: screenWidth, height: windowHeight } = useWindowDimensions();
  // The translucent modal covers the status and navigation bars, so use the full screen height on Android.
  const screenHeight = Platform.OS === 'android' ? Dimensions.get('screen').height : windowHeight;
  const active = useTipsStore((s) => s.active);
  const tip = useTipsStore(activeTip);
  const rect = useTipsStore((s) => (tip ? s.rects[tip.anchor] : undefined));
  const next = useTipsStore((s) => s.next);
  const finish = useTipsStore((s) => s.finish);
  // If the anchor never measures (e.g. hidden on this screen), show the bubble centered instead.
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    setUseFallback(false);
    if (!tip) return;
    const timer = setTimeout(() => setUseFallback(true), 700);
    return () => clearTimeout(timer);
  }, [tip]);

  if (!active || !tip || (!rect && !useFallback)) return null;

  const total = SCREEN_TIPS[active.screen].length;
  const isLast = active.index === total - 1;
  const bubbleWidth = Math.min(BUBBLE_MAX_WIDTH, screenWidth - 32);

  let spot: { x: number; y: number; width: number; height: number } | null = null;
  let bubblePosition: { top?: number; bottom?: number; left: number } = {
    left: (screenWidth - bubbleWidth) / 2,
    top: screenHeight / 2 - BUBBLE_HEIGHT_ESTIMATE / 2,
  };
  let arrow: { left: number; pointsUp: boolean } | null = null;

  if (rect) {
    // On Android, measureInWindow starts below the status bar, but this translucent modal starts above it.
    const offsetY = Platform.OS === 'android' ? StatusBar.currentHeight ?? 0 : 0;
    spot = {
      x: rect.x - SPOTLIGHT_PADDING,
      y: rect.y + offsetY - SPOTLIGHT_PADDING,
      width: rect.width + SPOTLIGHT_PADDING * 2,
      height: rect.height + SPOTLIGHT_PADDING * 2,
    };
    const centerX = rect.x + rect.width / 2;
    const left = Math.min(Math.max(centerX - bubbleWidth / 2, 16), screenWidth - bubbleWidth - 16);
    const arrowLeft = Math.min(Math.max(centerX - left - 8, 16), bubbleWidth - 32);
    const spaceBelow = screenHeight - (spot.y + spot.height) - 24;
    const spaceAbove = spot.y - 24;
    if (spaceBelow >= BUBBLE_HEIGHT_ESTIMATE + 12) {
      bubblePosition = { left, top: spot.y + spot.height + 12 };
      arrow = { left: arrowLeft, pointsUp: true };
    } else if (spaceAbove >= BUBBLE_HEIGHT_ESTIMATE + 12) {
      bubblePosition = { left, bottom: screenHeight - spot.y + 12 };
      arrow = { left: arrowLeft, pointsUp: false };
    } else {
      // Tall targets: keep the bubble at the bottom of the screen, over the target.
      bubblePosition = { left, bottom: 72 };
    }
  }

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent navigationBarTranslucent onRequestClose={finish}>
      {spot ? (
        <>
          <View style={{ position: 'absolute', left: 0, right: 0, top: 0, height: Math.max(spot.y, 0), backgroundColor: DIM }} />
          <View style={{ position: 'absolute', left: 0, right: 0, top: spot.y + spot.height, bottom: 0, backgroundColor: DIM }} />
          <View style={{ position: 'absolute', left: 0, width: Math.max(spot.x, 0), top: spot.y, height: spot.height, backgroundColor: DIM }} />
          <View style={{ position: 'absolute', left: spot.x + spot.width, right: 0, top: spot.y, height: spot.height, backgroundColor: DIM }} />
          <View style={{ position: 'absolute', left: spot.x, top: spot.y, width: spot.width, height: spot.height, borderRadius: 12, borderWidth: 2, borderColor: '#fff' }} />
        </>
      ) : (
        <View style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, backgroundColor: DIM }} />
      )}

      <View style={{ position: 'absolute', width: bubbleWidth, ...bubblePosition }}>
        {arrow?.pointsUp && <Arrow left={arrow.left} pointsUp />}
        <View style={{ backgroundColor: Colors.surface, borderRadius: 14, padding: 16, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.text }}>{tip.title}</Text>
          <Text style={{ fontSize: 14, color: Colors.textSecondary, marginTop: 6, lineHeight: 20 }}>{tip.text}</Text>
          {isLast && (
            <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 10 }}>
              Tap ? at the top of any screen to see its tips again.
            </Text>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 14 }}>
            <Text style={{ flex: 1, fontSize: 12, color: Colors.textMuted }}>{active.index + 1} of {total}</Text>
            {!isLast && (
              <TouchableOpacity onPress={finish} style={{ paddingHorizontal: 12, paddingVertical: 8 }}>
                <Text style={{ fontSize: 14, fontWeight: '600', color: Colors.textSecondary }}>Skip</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={next} style={{ backgroundColor: Colors.primary, borderRadius: 8, paddingHorizontal: 16, paddingVertical: 8, marginLeft: 4 }}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: '#fff' }}>{isLast ? 'Got it' : 'Next'}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {arrow && !arrow.pointsUp && <Arrow left={arrow.left} pointsUp={false} />}
      </View>
    </Modal>
  );
}

function Arrow({ left, pointsUp }: { left: number; pointsUp: boolean }) {
  return (
    <View
      style={{
        width: 16,
        height: 16,
        backgroundColor: Colors.surface,
        transform: [{ rotate: '45deg' }],
        marginLeft: left,
        marginTop: pointsUp ? 0 : -8,
        marginBottom: pointsUp ? -8 : 0,
        zIndex: 1,
      }}
    />
  );
}
