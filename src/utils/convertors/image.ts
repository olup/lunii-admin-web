export const convertImageToBmp4 = async (blob: Blob): Promise<Blob> => {
  const img = await getImage(blob);
  const ctx = await resizeAndFlip(img);
  const bmp = await create4BitGrayscaleBMP(ctx);
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
const resizeAndFlip = async (img: HTMLImageElement) => {
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

  // flip horizontally
  ctx.scale(1, -1);
  ctx.translate(0, -height);

  ctx.drawImage(img, 0, 0, newWidth, newHeight);
  return ctx;
};

function create4BitGrayscaleBMP(
  context: OffscreenCanvasRenderingContext2D
): Uint8Array {
  const width = context.canvas.width;
  const height = context.canvas.height;

  const imageData = context.getImageData(0, 0, width, height);
  const data = imageData.data;

  const bmpData: number[] = [];

  // Encode bitmap pixels as 4-bit grayscale, RLE_4 compressed
  for (let i = 0; i < height; i++) {
    let lineFeed = { length: 0, color: 0 };

    for (let j = 0; j < width; j++) {
      const index = (i * width + j) * 4;

      const grayscaleValue = Math.floor(
        (data[index] * 0.299 +
          data[index + 1] * 0.587 +
          data[index + 2] * 0.114) /
          16
      );

      if (j === 0) {
        lineFeed = { length: 1, color: grayscaleValue };
        continue;
      }

      if (lineFeed.color == grayscaleValue && lineFeed.length < 255) {
        // If this is the same color as the last pixel, just augment the length
        lineFeed.length++;
      } else {
        // otherwise, write the code to the array and start a new count
        const color8 = (lineFeed.color << 4) | lineFeed.color;
        bmpData.push(lineFeed.length, color8);

        // add a new color
        lineFeed = { length: 1, color: grayscaleValue };
      }
    }

    // commit data
    const color8 = (lineFeed.color << 4) | lineFeed.color;
    bmpData.push(lineFeed.length, color8);

    // end of line, but not for the last line
    if (i < height - 1) {
      bmpData.push(0x00, 0x00);
    }
  }
  // end of file
  bmpData.push(0x00, 0x01);

  // now let's encode the bmp

  const headerSize = 54;
  const dataSize = bmpData.length;
  const paletteSize = 16 * 4; // 16 shades of gray * 4 bytes per color entry
  const dataOffset = headerSize + paletteSize;
  const fileSize = dataOffset + dataSize;

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
    dataOffset & 0xff,
    (dataOffset >> 8) & 0xff,
    (dataOffset >> 16) & 0xff,
    (dataOffset >> 24) & 0xff, // Bitmap data offset (54 bytes)
    0x28,
    0x00,
    0x00,
    0x00, // Header size (40 bytes)
    width & 0xff, // Width
    (width >> 8) & 0xff,
    (width >> 16) & 0xff,
    (width >> 24) & 0xff,
    height & 0xff, // Height
    (height >> 8) & 0xff,
    (height >> 16) & 0xff,
    (height >> 24) & 0xff,
    0x01,
    0x00, // Number of color planes (1)
    0x04,
    0x00, // 4 bits per pixel
    0x02,
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
    0x00,
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
    const index = headerSize + i * 4;
    const gray = (255 / 16) * i;

    bmpBuffer[index] = gray; // Blue
    bmpBuffer[index + 1] = gray; // Green
    bmpBuffer[index + 2] = gray; // Red
    bmpBuffer[index + 3] = 0; // Reserved
  }

  // add bmp data to buffer
  bmpBuffer.set(bmpData, headerSize + paletteSize);

  return bmpBuffer;
}
