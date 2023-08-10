export const convertImageToBmp4 = async (blob: Blob): Promise<Blob> => {
  const img = await getImage(blob);
  const bmp = await treatImage(img);
  return new Blob([bmp], { type: "image/bmp" });
};

const getImage = async (blob: Blob): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = URL.createObjectURL(blob);
  });
};

// resize and convert to bmp4
const treatImage = async (img: HTMLImageElement) => {
  const width = 320;
  const height = 240;

  const offscreenCanvas = new OffscreenCanvas(width, height);
  const ctx = offscreenCanvas.getContext("2d");
  if (!ctx) throw new Error("Cannot get context");

  const imgWidth = img.width;
  const imgHeight = img.height;
  const scale = Math.max(width / imgWidth, height / imgHeight);
  const newWidth = imgWidth * scale;
  const newHeight = imgHeight * scale;

  offscreenCanvas.width = width;
  offscreenCanvas.height = height;

  // flip horizontally
  ctx.scale(1, -1);
  ctx.translate(0, -height);

  ctx.drawImage(img, 0, 0, newWidth, newHeight);

  return await create4BitGrayscaleBMP(ctx);
};

function create4BitGrayscaleBMP(
  context: OffscreenCanvasRenderingContext2D
): Uint8Array {
  const canvasWidth = context.canvas.width;
  const canvasHeight = context.canvas.height;

  const imageData = context.getImageData(0, 0, canvasWidth, canvasHeight);
  const data = imageData.data;

  const dataSize = (canvasWidth * canvasHeight) / 2; // 4 bits per pixel
  const paletteSize = 16 * 4; // 16 shades of gray * 4 bytes per color entry
  const fileSize = 54 + paletteSize + dataSize;

  const bmpBuffer = new Uint8Array(fileSize);

  // BMP Header
  bmpBuffer.set([
    0x42,
    0x4d, // BM (bitmap signature)
    fileSize & 0xff, // File size
    (fileSize >> 8) & 0xff,
    (fileSize >> 16) & 0xff,
    (fileSize >> 24) & 0xff,
    0x00,
    0x00,
    0x00,
    0x00, // Reserved
    0x36,
    0x00,
    0x00,
    0x00, // Bitmap data offset (54 bytes)
    0x28,
    0x00,
    0x00,
    0x00, // Header size (40 bytes)
    canvasWidth & 0xff, // Width
    (canvasWidth >> 8) & 0xff,
    (canvasWidth >> 16) & 0xff,
    (canvasWidth >> 24) & 0xff,
    canvasHeight & 0xff, // Height
    (canvasHeight >> 8) & 0xff,
    (canvasHeight >> 16) & 0xff,
    (canvasHeight >> 24) & 0xff,
    0x01,
    0x00, // Number of color planes (1)
    0x04,
    0x00, // 4 bits per pixel
    0x00,
    0x00,
    0x00,
    0x00, // Compression method
    dataSize & 0xff, // Image data size
    (dataSize >> 8) & 0xff,
    (dataSize >> 16) & 0xff,
    (dataSize >> 24) & 0xff,
    0x00,
    0x00,
    0x00,
    0x00, // Horizontal resolution
    0x00,
    0x00,
    0x00,
    0x00, // Vertical resolution
    0x10,
    0x00,
    0x00,
    0x00, // Palette colors (16)
    0x00,
    0x00,
    0x00,
    0x00, // Important colors (0 = all)
  ]);

  // BMP Palette (Grayscale)
  for (let i = 0; i < 16; i++) {
    const gray = (255 / 16) * i;
    bmpBuffer[54 + i * 4] = gray; // Blue
    bmpBuffer[55 + i * 4] = gray; // Green
    bmpBuffer[56 + i * 4] = gray; // Red
    bmpBuffer[57 + i * 4] = 0; // Reserved
  }

  // Convert RGBA to 4-bit grayscale and store in bmpBuffer
  let bmpDataIndex = 54 + paletteSize;
  let bmpDataByte = 0;
  let bmpDataBitOffset = 4;

  for (let i = 0; i < data.length; i += 4) {
    const grayscaleValue = Math.floor(
      (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 16
    );

    bmpDataByte |= (grayscaleValue & 0xf) << bmpDataBitOffset;
    bmpDataBitOffset -= 4;

    if (bmpDataBitOffset < 0) {
      bmpBuffer[bmpDataIndex] = bmpDataByte;
      bmpDataByte = 0;
      bmpDataBitOffset = 4;
      bmpDataIndex++;
    }
  }

  return bmpBuffer;
}
