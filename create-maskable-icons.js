const { createCanvas } = require('canvas');
const fs = require('fs');
const path = require('path');

function createMaskableIcon(size) {
    const canvas = createCanvas(size, size);
    const ctx = canvas.getContext('2d');
    const padding = size * 0.1; // 10% padding for safe area

    // Fill background
    ctx.fillStyle = '#4CAF50';
    ctx.fillRect(0, 0, size, size);

    // Add a circular highlight in the safe area
    ctx.beginPath();
    ctx.arc(size/2, size/2, (size - padding*2)/2, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.fill();

    // Add text in the safe area
    const fontSize = Math.floor(size * 0.35); // Adjust font size based on icon size
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Y', size/2, size/2);

    return canvas;
}

// Create maskable icons
[192, 512].forEach(size => {
    const canvas = createMaskableIcon(size);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(
        path.join(__dirname, 'public', 'icons', `maskable-${size}x${size}.png`),
        buffer
    );
    console.log(`Created maskable icon ${size}x${size}`);
}); 