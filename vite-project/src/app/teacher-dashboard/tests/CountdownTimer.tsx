import React, { useEffect, useState } from "react";

interface CountdownTimerProps {
  endTime: string; // ISO datetime string
  onTimeUp: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ endTime, onTimeUp }) => {
  const calculateTimeLeft = () => {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    return Math.max(Math.floor((end - now) / 1000), 0);
  };

  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [endTime, timeLeft, onTimeUp]);

  const formatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60)
      .toString()
      .padStart(2, "0");
    const seconds = (totalSeconds % 60).toString().padStart(2, "0");
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="bg-gray-200 px-2 py-1 rounded-lg text-center">
      {formatTime(timeLeft)}
    </div>
  );
};

export default CountdownTimer;
