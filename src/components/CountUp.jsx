import React, { useEffect, useState } from "react";

export default function CountUp({ to = 0, suffix = "", duration = 500 }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let startTimestamp = null;
    const startValue = current;
    const endValue = typeof to === "number" ? to : parseFloat(to) || 0;

    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      setCurrent(Math.round(startValue + (endValue - startValue) * easeProgress));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    window.requestAnimationFrame(step);
  }, [to]);

  return (
    <span>
      {current}
      {suffix}
    </span>
  );
}
