/**
 * FlierCarousel.js — Umurongo w'amafliyeri (auto-scrolling ad strip).
 *
 * Sits right below the Shop tab's search bar. Continuously slides left on
 * its own (not a swipe-and-snap carousel) — the classic marquee technique:
 * render the flier row twice back-to-back, animate it left by exactly one
 * row's width, then snap back to 0 with zero-duration and repeat, which
 * looks seamless since row #2 is already sitting where row #1 started.
 * Still tappable mid-animation (Animated transforms don't block touch),
 * so tapping a flier opens the business it promotes.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image, Pressable, Animated, Easing, useWindowDimensions, StyleSheet } from 'react-native';
import { radius, gutter } from '../../theme';

const CARD_HEIGHT = 190;
const CARD_GAP = 12;
const PX_PER_SECOND = 34; // marquee speed

export default function FlierCarousel({ fliers, businesses, onPressFlier, style }) {
  const { width } = useWindowDimensions();
  const [rowWidth, setRowWidth] = useState(0);
  const translateX = useRef(new Animated.Value(0)).current;
  const loopRef = useRef(null);

  // Each flier fills the same content width as everything else on the
  // screen (matching the search bar above it) rather than peeking the next
  // card — capped on a wide desktop browser so it doesn't stretch absurdly.
  const cardWidth = Math.min(width - gutter * 2, 640);

  const startLoop = useCallback(
    (measuredWidth) => {
      if (loopRef.current) loopRef.current.stop();
      translateX.setValue(0);
      const duration = (measuredWidth / PX_PER_SECOND) * 1000;
      loopRef.current = Animated.loop(
        Animated.sequence([
          Animated.timing(translateX, {
            toValue: -measuredWidth,
            duration,
            easing: Easing.linear,
            useNativeDriver: true,
          }),
          Animated.timing(translateX, { toValue: 0, duration: 0, useNativeDriver: true }),
        ])
      );
      loopRef.current.start();
    },
    [translateX]
  );

  useEffect(() => {
    if (rowWidth > 0) startLoop(rowWidth);
    return () => loopRef.current?.stop();
  }, [rowWidth, startLoop]);

  if (!fliers.length) return null;

  const handleRowLayout = (e) => {
    const w = e.nativeEvent.layout.width;
    if (Math.abs(w - rowWidth) > 1) setRowWidth(w);
  };

  const renderRow = (keyPrefix, onLayout) => (
    <View style={styles.row} onLayout={onLayout}>
      {fliers.map((flier) => {
        const business = businesses.find((b) => b.id === flier.businessId);
        return (
          <Pressable
            key={`${keyPrefix}-${flier.id}`}
            onPress={() => onPressFlier(flier)}
            accessibilityRole="button"
            accessibilityLabel={business ? `Flier: ${business.name}` : 'Flier'}
            style={[styles.card, { width: cardWidth, marginRight: CARD_GAP }]}
          >
            <Image source={{ uri: flier.imageUri }} style={styles.image} resizeMode="cover" />
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <View style={[styles.wrap, style]}>
      <Animated.View style={[styles.track, { transform: [{ translateX }] }]}>
        {renderRow('a', handleRowLayout)}
        {rowWidth > 0 ? renderRow('b') : null}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { height: CARD_HEIGHT, overflow: 'hidden' },
  track: { flexDirection: 'row' },
  row: { flexDirection: 'row' },
  card: {
    height: CARD_HEIGHT,
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  image: { width: '100%', height: '100%' },
});
