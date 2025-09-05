"use client";

import React from 'react';
import styles from './Squares.module.css';

interface SquaresProps {
  className?: string;
  size?: number; // visual size of the loader in px (scaled)
}

// A faithful port of the original squares loader animation from the playground.
// We keep the CSS and timing identical, and scale the whole block for size.
export const Squares: React.FC<SquaresProps> = ({ className = "", size = 96 }) => {
  const scale = size / 96; // Original loader is 96x96

  return (
    <div className={className} style={{ lineHeight: 0 }}>
      <div className={styles.loader} style={{ transform: `scale(${scale})` }}>
        <div className={styles.loaderSquare} />
        <div className={styles.loaderSquare} />
        <div className={styles.loaderSquare} />
        <div className={styles.loaderSquare} />
        <div className={styles.loaderSquare} />
        <div className={styles.loaderSquare} />
        <div className={styles.loaderSquare} />
      </div>
    </div>
  );
};
