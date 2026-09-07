/**
 * BrandLogo.js — Ikirangantego (the globe mark).
 * The same three-ellipse globe from the web mockup, redrawn with react-native-svg
 * so it stays crisp at any size.
 */
import React from 'react';
import Svg, { Ellipse, Circle, Line } from 'react-native-svg';
import { colors } from '../../theme';

export default function BrandLogo({ size = 32, showMeridians = false, opacity = 1 }) {
  // The artwork is drawn on a 112x112 grid and scaled by the size prop.
  const scale = size / 112;
  const stroke = (w) => Math.max(0.6, w * scale * 1.1);

  return (
    <Svg width={size} height={size} viewBox="0 0 112 112" opacity={opacity}>
      {/* Outer sphere */}
      <Ellipse
        cx="56"
        cy="56"
        rx="52"
        ry="52"
        fill="none"
        stroke={colors.blue300}
        strokeWidth={stroke(4.5)}
      />
      {/* Equator */}
      <Ellipse
        cx="56"
        cy="56"
        rx="52"
        ry="18"
        fill="none"
        stroke={colors.blue500}
        strokeWidth={stroke(3.5)}
      />
      {/* Prime meridian */}
      <Ellipse
        cx="56"
        cy="56"
        rx="18"
        ry="52"
        fill="none"
        stroke={colors.blue200}
        strokeWidth={stroke(3)}
      />

      {showMeridians ? (
        <>
          <Line x1="4" y1="56" x2="108" y2="56" stroke={colors.blue500} strokeWidth={stroke(1.4)} opacity={0.5} />
          <Line x1="56" y1="4" x2="56" y2="108" stroke={colors.blue500} strokeWidth={stroke(1.4)} opacity={0.5} />
        </>
      ) : null}

      <Circle cx="56" cy="56" r={5.5} fill={colors.blue500} />
    </Svg>
  );
}
