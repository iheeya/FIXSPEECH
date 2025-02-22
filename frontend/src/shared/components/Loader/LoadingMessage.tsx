import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CircularProgress from "@mui/material/CircularProgress";

const loadingMessages = [
  "AI가 당신의 목소리를 더 멋지게 만들어줄 팁을 생각하고 있어요...",
  "곧 준비가 완료됩니다...",
];

export function LoadingMessage() {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <CircularProgress sx={{ color: "#EE719E" }} />
      <AnimatePresence mode="wait">
        <motion.p
          key={messageIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="text-gray-300 text-center max-w-md"
        >
          {loadingMessages[messageIndex]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
