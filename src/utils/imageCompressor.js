/**
 * imageCompressor.js
 * Client-side image compression using Canvas API — no external libraries needed.
 * Resizes to max 800×600 and encodes as JPEG at 75% quality.
 */

/**
 * Compresses an image File/Blob using the Canvas API.
 * @param {File} file - The image file to compress.
 * @param {object} options
 * @param {number} options.maxWidth  - Max output width in pixels  (default: 800)
 * @param {number} options.maxHeight - Max output height in pixels (default: 600)
 * @param {number} options.quality   - JPEG quality 0–1            (default: 0.75)
 * @returns {Promise<{ base64: string, originalSize: number, compressedSize: number }>}
 */
export function compressImage(file, options = {}) {
  const {
    maxWidth  = 800,
    maxHeight = 600,
    quality   = 0.75,
  } = options;

  return new Promise((resolve, reject) => {
    if (!file || !file.type.startsWith('image/')) {
      reject(new Error('File bukan gambar yang valid.'));
      return;
    }

    const originalSize = file.size;
    const reader = new FileReader();

    reader.onerror = () => reject(new Error('Gagal membaca file.'));

    reader.onload = (e) => {
      const img = new Image();

      img.onerror = () => reject(new Error('Gagal memuat gambar.'));

      img.onload = () => {
        // Calculate dimensions — keep aspect ratio, never upscale
        const ratio = Math.min(
          maxWidth  / img.width,
          maxHeight / img.height,
          1, // never upscale
        );
        const canvasW = Math.round(img.width  * ratio);
        const canvasH = Math.round(img.height * ratio);

        const canvas = document.createElement('canvas');
        canvas.width  = canvasW;
        canvas.height = canvasH;

        const ctx = canvas.getContext('2d');
        // White background (prevents transparency issues on JPEG)
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, canvasW, canvasH);
        ctx.drawImage(img, 0, 0, canvasW, canvasH);

        const base64 = canvas.toDataURL('image/jpeg', quality);

        // Estimate compressed size from base64 string
        // base64 length * 0.75 ≈ byte size
        const compressedSize = Math.round((base64.length * 3) / 4);

        resolve({ base64, originalSize, compressedSize, width: canvasW, height: canvasH });
      };

      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  });
}

/**
 * Format file size to human-readable string.
 * @param {number} bytes
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (bytes < 1024)        return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
