# Image Optimization Guide

## Current Issues
- `showroom.jpg` - **4.4MB** (needs to be <500KB)
- Project images are 230-612KB (could be <200KB each)

## Quick Fix: Use Online Tools

### Option 1: TinyPNG (Easiest)
1. Go to https://tinypng.com/
2. Upload `assets/showroom.jpg`
3. Download compressed version
4. Replace the original

### Option 2: Squoosh (Most Control)
1. Go to https://squoosh.app/
2. Upload image
3. Set quality to 80-85%
4. Choose WebP format for modern browsers
5. Download

## Terminal Command (Mac/Linux)

If you have ImageMagick installed:

```bash
# Install ImageMagick (Mac)
brew install imagemagick

# Compress showroom.jpg
convert assets/showroom.jpg -quality 85 -resize 1920x1080^ -gravity center -extent 1920x1080 assets/showroom-optimized.jpg

# Compress all project images
for img in assets/*.jpg; do
  convert "$img" -quality 85 -resize 1200x1200\> "$img"
done
```

## WebP Conversion (Modern Format)

WebP provides 25-35% better compression:

```bash
# Install cwebp (Mac)
brew install webp

# Convert to WebP
cwebp -q 85 assets/showroom.jpg -o assets/showroom.webp
```

## Targets
- **Hero background:** <500KB
- **Project images:** <200KB each
- **Logos:** Already optimized (20KB)

## After Optimization
Update `index.html` to use optimized images, or implement WebP with JPEG fallback:

```html
<picture>
  <source srcset="assets/showroom.webp" type="image/webp">
  <img src="assets/showroom.jpg" alt="Cowdog Print Co showroom">
</picture>
```
