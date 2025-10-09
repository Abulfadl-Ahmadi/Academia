import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const inputDir = './public/Glass_shapes';
const outputDir = './public/Glass_shapes_optimized';

// Create output directory if it doesn't exist
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

async function optimizeImage(filename) {
  const inputPath = path.join(inputDir, filename);
  const outputPath = path.join(outputDir, filename.replace('.png', '.webp'));
  
  try {
    const info = await sharp(inputPath)
      .resize(200, 200, { // Resize to maximum 200x200
        fit: 'inside',
        withoutEnlargement: true
      })
      .webp({ 
        quality: 60, // Lower quality for smaller size
        effort: 6    // Higher effort for better compression
      })
      .toFile(outputPath);
    
    const originalSize = fs.statSync(inputPath).size;
    const newSize = info.size;
    const savings = ((originalSize - newSize) / originalSize * 100).toFixed(1);
    
    console.log(`✓ ${filename}: ${(originalSize / 1024 / 1024).toFixed(2)}MB → ${(newSize / 1024).toFixed(2)}KB (${savings}% smaller)`);
  } catch (error) {
    console.error(`❌ Error processing ${filename}:`, error.message);
  }
}

async function optimizeAllImages() {
  console.log('🖼️  Starting image optimization...\n');
  
  const files = fs.readdirSync(inputDir).filter(file => file.endsWith('.png'));
  
  for (const file of files) {
    await optimizeImage(file);
  }
  
  console.log('\n🎉 Image optimization complete!');
  console.log('\n📁 Optimized images saved to:', outputDir);
  console.log('💡 Don\'t forget to update your image paths to use .webp format');
}

optimizeAllImages().catch(console.error);