/**
 * TextToVectorConverter - Converts text to vector paths using Canvas2D
 * Extracts glyph outlines for drone positioning
 */

import * as THREE from 'three';

export class TextToVectorConverter {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = 2048;
        this.canvas.height = 512;
    }

    /**
     * Convert text to sampled points
     * @param {string} text - Text to convert
     * @param {object} options - Configuration options
     * @returns {object} - { letters: Array<{char, points}>, bounds }
     */
    convertText(text, options = {}) {
        const {
            fontSize = 200,
            fontFamily = 'Arial, sans-serif',
            fontWeight = 'bold',
            samplingDensity = 1.0, // Points per pixel
            spacing = 1.2 // Letter spacing multiplier
        } = options;

        // Setup canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.font = `${fontWeight} ${fontSize}px ${fontFamily}`;
        this.ctx.fillStyle = '#ffffff';
        this.ctx.textBaseline = 'middle';

        const letters = [];
        let currentX = 50; // Start position

        // Process each character
        for (let i = 0; i < text.length; i++) {
            const char = text[i];

            // Skip spaces
            if (char === ' ') {
                currentX += fontSize * 0.5 * spacing;
                continue;
            }

            // Measure character
            const metrics = this.ctx.measureText(char);
            const charWidth = metrics.width;

            // Clear and draw character
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.fillText(char, currentX, this.canvas.height / 2);

            // Sample points from the rendered character
            const points = this.sampleCharacter(
                currentX,
                this.canvas.height / 2,
                charWidth,
                fontSize,
                samplingDensity
            );

            if (points.length > 0) {
                letters.push({
                    char,
                    points,
                    position: currentX,
                    width: charWidth
                });
            }

            // Move to next character position
            currentX += charWidth * spacing;
        }

        // Calculate bounds
        const allPoints = letters.flatMap(l => l.points);
        const bounds = this.calculateBounds(allPoints);

        // Center points around origin
        this.centerPoints(allPoints, bounds);

        return {
            letters,
            bounds,
            totalPoints: allPoints.length
        };
    }

    /**
     * Sample points from a rendered character on canvas
     */
    sampleCharacter(centerX, centerY, width, height, density) {
        const points = [];

        // Define sampling area
        const padding = 20;
        const x1 = Math.max(0, centerX - width / 2 - padding);
        const x2 = Math.min(this.canvas.width, centerX + width / 2 + padding);
        const y1 = Math.max(0, centerY - height / 2 - padding);
        const y2 = Math.min(this.canvas.height, centerY + height / 2 + padding);

        // Get image data
        const imageData = this.ctx.getImageData(x1, y1, x2 - x1, y2 - y1);
        const data = imageData.data;

        // Sample points based on pixel density
        const step = Math.max(1, Math.floor(1 / density));

        for (let y = 0; y < imageData.height; y += step) {
            for (let x = 0; x < imageData.width; x += step) {
                const i = (y * imageData.width + x) * 4;
                const alpha = data[i + 3];

                // If pixel is visible, add as a point
                if (alpha > 128) {
                    points.push(new THREE.Vector3(
                        x1 + x,
                        y1 + y,
                        0
                    ));
                }
            }
        }

        return points;
    }

    /**
     * Calculate bounding box of points
     */
    calculateBounds(points) {
        if (points.length === 0) {
            return { min: new THREE.Vector3(), max: new THREE.Vector3(), size: new THREE.Vector3() };
        }

        const min = new THREE.Vector3(Infinity, Infinity, Infinity);
        const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

        for (const point of points) {
            min.x = Math.min(min.x, point.x);
            min.y = Math.min(min.y, point.y);
            min.z = Math.min(min.z, point.z);
            max.x = Math.max(max.x, point.x);
            max.y = Math.max(max.y, point.y);
            max.z = Math.max(max.z, point.z);
        }

        const size = new THREE.Vector3().subVectors(max, min);
        const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);

        return { min, max, size, center };
    }

    /**
     * Center points around origin
     */
    centerPoints(points, bounds) {
        const center = bounds.center;

        for (const point of points) {
            point.x -= center.x;
            point.y -= center.y;
            point.z -= center.z;
        }
    }

    /**
     * Scale points to fit within a target size
     */
    scalePoints(points, targetSize) {
        const bounds = this.calculateBounds(points);
        const maxDimension = Math.max(bounds.size.x, bounds.size.y);
        const scale = targetSize / maxDimension;

        for (const point of points) {
            point.multiplyScalar(scale);
        }
    }
}
