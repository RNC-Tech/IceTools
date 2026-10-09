"use client";
import React, { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import { motion, useAnimation } from "motion/react";

const ICON_VARIANTS = {
  normal: {
    rotate: 0,
    y: 0,
    transition: { duration: 0.2, ease: "easeOut" },
  },
  animate: {
    rotate: [0, -10, 10, -4, 4, 0],
    y: [0, -1.5, 0],
    transition: { duration: 0.45, ease: "easeInOut" },
  },
};

const AnimatedIcon = forwardRef(
  ({ icon: Icon, size = 16, className = "", onMouseEnter, onMouseLeave, ...props }, ref) => {
    if (!Icon) return null;

    const controls = useAnimation();
    const innerRef = useRef(null);

    const startAnimation = useCallback(() => {
      if (innerRef.current?.startAnimation) {
        innerRef.current.startAnimation();
      } else {
        controls.start("animate");
      }
    }, [controls]);

    const stopAnimation = useCallback(() => {
      if (innerRef.current?.stopAnimation) {
        innerRef.current.stopAnimation();
      } else {
        controls.start("normal");
      }
    }, [controls]);

    useImperativeHandle(ref, () => ({
      startAnimation,
      stopAnimation,
    }));

    const handleMouseEnter = useCallback(
      (e) => {
        startAnimation();
        onMouseEnter?.(e);
      },
      [startAnimation, onMouseEnter]
    );

    const handleMouseLeave = useCallback(
      (e) => {
        stopAnimation();
        onMouseLeave?.(e);
      },
      [stopAnimation, onMouseLeave]
    );

    return (
      <motion.span
        className={`inline-flex items-center justify-center ${className}`}
        style={{ display: "inline-flex" }}
        animate={controls}
        initial="normal"
        variants={ICON_VARIANTS}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        <Icon ref={innerRef} size={size} {...props} />
      </motion.span>
    );
  }
);

AnimatedIcon.displayName = "AnimatedIcon";
export default AnimatedIcon;
