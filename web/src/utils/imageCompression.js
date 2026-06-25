import imageCompression from 'browser-image-compression';

/**
 * Comprime una imagen en el cliente para optimizar el tamaño antes de subirla.
 * @param {File} imageFile - El archivo original del input de tipo file.
 * @returns {Promise<File>} El archivo comprimido listo para su envío.
 */
export async function compressImage(imageFile) {
  const options = {
    maxSizeMB: 0.25, // Reducir a un máximo de ~250 KB
    maxWidthOrHeight: 1024, // Limitar a un ancho/alto máximo de 1024px
    useWebWorker: true, // Usa hilos en segundo plano del navegador para no congelar la pantalla
    fileType: 'image/jpeg' // Convertir a JPEG para máxima compatibilidad
  };

  try {
    console.log(`[Compresión] Tamaño original: ${(imageFile.size / 1024 / 1024).toFixed(2)} MB`);
    const compressedFile = await imageCompression(imageFile, options);
    console.log(`[Compresión] Nuevo tamaño: ${(compressedFile.size / 1024).toFixed(2)} KB`);
    return compressedFile;
  } catch (error) {
    console.error('[Compresión] Error al comprimir la imagen, usando original:', error);
    return imageFile; // Si falla, devolvemos el archivo original como fallback
  }
}
