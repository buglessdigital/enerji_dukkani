export async function convertToWebP(file: File, maxWidth = 1920, quality = 0.8): Promise<File> {
  // Eger zaten webp ise ve isimlendirme karisikligi olmasin istiyorsan, yine de yeniden boyutlandirmak iyi olabilir, 
  // ama basitce boyut kontrolu de yapilabilir. Burada standart dönüsümleri sagliyoruz.
  
  return new Promise((resolve, reject) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      
      const canvas = document.createElement('canvas')
      let width = img.width
      let height = img.height

      // Calculate new dimensions respecting maxWidth
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }

      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) {
        return reject(new Error('Canvas context could not be created'))
      }

      // Draw image
      ctx.drawImage(img, 0, 0, width, height)

      // Convert to WebP blob
      canvas.toBlob((blob) => {
        if (!blob) {
          return reject(new Error('Blob conversion failed'))
        }
        
        // Cok hizli bir sekilde filename olusturalim
        const originalName = file.name
        const newFileName = originalName.replace(/\.[^/.]+$/, "") + '-' + Date.now() + '.webp'
        
        const webpFile = new File([blob], newFileName, {
          type: 'image/webp',
          lastModified: Date.now(),
        })
        
        resolve(webpFile)
      }, 'image/webp', quality)
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load image for conversion'))
    }

    img.src = objectUrl
  })
}
