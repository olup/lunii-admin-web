import { Box, Space, TextInput } from "@mantine/core";
import { useEffect, useRef, useState } from "react";

export const TextImageCreator = () => {
  const [text, setText] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.font = "48px serif";
    ctx.fillText(text, 10, 50);
  }, [text]);

  return (
    <Box>
      <TextInput value={text} onChange={(e) => setText(e.target.value)} />
      <Space h={10} />
      <canvas id="canvas" width="320" height="240" ref={canvasRef}></canvas>
    </Box>
  );
};
