/**
 * Camera utilities for Capacitor.
 * Returns base64 data URLs; falls back to null on cancel / error.
 */

/**
 * Captures a photo using the device camera.
 * Returns a base64 data URL string, or null if the user cancelled or an error occurred.
 */
export async function capturePhoto(): Promise<string | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
      quality: 85,
    });
    return photo.dataUrl ?? null;
  } catch (e) {
    // User cancelled or permission denied — not a fatal error
    console.warn("[Camera] capturePhoto cancelled or failed:", e);
    return null;
  }
}

/**
 * Opens the device photo gallery for the user to pick an image.
 * Returns a base64 data URL string, or null if the user cancelled or an error occurred.
 */
export async function pickFromGallery(): Promise<string | null> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import("@capacitor/camera");
    const photo = await Camera.getPhoto({
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Photos,
      quality: 85,
    });
    return photo.dataUrl ?? null;
  } catch (e) {
    console.warn("[Camera] pickFromGallery cancelled or failed:", e);
    return null;
  }
}
