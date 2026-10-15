/**
 * useNarrow.js — true on phone-sized screens (follows rotation and resizing).
 */
import { useEffect, useState } from 'react';

export default function useNarrow(width = 700) {
  const [narrow, setNarrow] = useState(() => window.innerWidth < width);
  useEffect(() => {
    const onResize = () => setNarrow(window.innerWidth < width);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [width]);
  return narrow;
}
