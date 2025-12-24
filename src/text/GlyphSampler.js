/**
 * GlyphSampler - Advanced glyph point sampling with adaptive density
 */

import * as THREE from 'three';

export class GlyphSampler {
    /**
     * Sample points with adaptive density (more points on curves)
     * @param {THREE.Vector3[]} rawPoints - Points from TextToVectorConverter
     * @param {object} options - Sampling options
     * @returns {THREE.Vector3[]} - Optimized point set
     */
    static adaptiveSample(rawPoints, options = {}) {
        const {
            targetPointCount = 100,
            curvatureThreshold = 0.1,
            minDistance = 0.5
        } = options;

        if (rawPoints.length <= targetPointCount) {
            return rawPoints;
        }

        // Use Ramer-Douglas-Peucker algorithm to simplify while preserving shape
        return this.ramerDouglasPeucker(rawPoints, curvatureThreshold);
    }

    /**
     * Ramer-Douglas-Peucker algorithm for polyline simplification
     */
    static ramerDouglasPeucker(points, epsilon) {
        if (points.length < 3) return points;

        // Find point with maximum distance from line
        let maxDistance = 0;
        let maxIndex = 0;
        const end = points.length - 1;

        for (let i = 1; i < end; i++) {
            const distance = this.perpendicularDistance(
                points[i],
                points[0],
                points[end]
            );
            if (distance > maxDistance) {
                maxDistance = distance;
                maxIndex = i;
            }
        }

        // If max distance is greater than epsilon, recursively simplify
        if (maxDistance > epsilon) {
            const left = this.ramerDouglasPeucker(points.slice(0, maxIndex + 1), epsilon);
            const right = this.ramerDouglasPeucker(points.slice(maxIndex), epsilon);

            // Combine results
            return [...left.slice(0, -1), ...right];
        } else {
            // Return endpoints only
            return [points[0], points[end]];
        }
    }

    /**
     * Calculate perpendicular distance from point to line
     */
    static perpendicularDistance(point, lineStart, lineEnd) {
        const dx = lineEnd.x - lineStart.x;
        const dy = lineEnd.y - lineStart.y;
        const dz = lineEnd.z - lineStart.z;

        const numerator = Math.abs(
            dy * point.z - dz * point.y +
            dz * point.x - dx * point.z +
            dx * point.y - dy * point.x
        );

        const denominator = Math.sqrt(dx * dx + dy * dy + dz * dz);

        return denominator === 0 ? 0 : numerator / denominator;
    }

    /**
     * Evenly distribute points along a path
     */
    static evenDistribution(points, targetCount) {
        if (points.length <= 1) return points;

        // Calculate total path length
        let totalLength = 0;
        const segmentLengths = [];

        for (let i = 1; i < points.length; i++) {
            const length = points[i].distanceTo(points[i - 1]);
            segmentLengths.push(length);
            totalLength += length;
        }

        // Sample points at even intervals
        const result = [points[0].clone()];
        const interval = totalLength / (targetCount - 1);
        let currentLength = 0;
        let targetLength = interval;

        for (let i = 1; i < points.length; i++) {
            const segmentLength = segmentLengths[i - 1];
            const segmentEnd = currentLength + segmentLength;

            while (targetLength <= segmentEnd && result.length < targetCount - 1) {
                const t = (targetLength - currentLength) / segmentLength;
                const point = new THREE.Vector3().lerpVectors(points[i - 1], points[i], t);
                result.push(point);
                targetLength += interval;
            }

            currentLength = segmentEnd;
        }

        // Add last point
        result.push(points[points.length - 1].clone());

        return result.slice(0, targetCount);
    }
}
