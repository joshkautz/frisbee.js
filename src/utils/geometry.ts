/**
 * Geometry utility functions for dome and shape calculations
 */

/**
 * Interpolate between rectangular corners and ellipse based on a weight factor
 * @param angle - Angle in radians around the perimeter
 * @param halfWidth - Half the width of the shape
 * @param halfLength - Half the length of the shape
 * @param rectangleWeight - 1 = rectangle, 0 = ellipse
 * @returns [x, z] coordinates on the perimeter
 */
export function getPointOnPerimeter(
  angle: number,
  halfWidth: number,
  halfLength: number,
  rectangleWeight: number
): [number, number] {
  // Ellipse point
  const ellipseX = halfWidth * Math.cos(angle);
  const ellipseZ = halfLength * Math.sin(angle);

  // Rectangle point - find intersection of ray with rectangle
  const cosA = Math.cos(angle);
  const sinA = Math.sin(angle);

  let rectX: number, rectZ: number;

  // Determine which edge the ray intersects
  const tanA = Math.abs(sinA / (cosA || 1e-10));
  const aspectRatio = halfLength / halfWidth;

  if (tanA <= aspectRatio) {
    // Intersects left or right edge
    rectX = Math.sign(cosA) * halfWidth;
    rectZ = rectX * (sinA / (cosA || 1e-10));
  } else {
    // Intersects top or bottom edge
    rectZ = Math.sign(sinA) * halfLength;
    rectX = rectZ * (cosA / (sinA || 1e-10));
  }

  // Interpolate between rectangle and ellipse
  const x = rectX * rectangleWeight + ellipseX * (1 - rectangleWeight);
  const z = rectZ * rectangleWeight + ellipseZ * (1 - rectangleWeight);

  return [x, z];
}

/**
 * Generate angles that include exact corner angles for a rectangle
 * This ensures the dome geometry hits the exact corners
 */
export function generateAnglesWithCorners(
  segmentsPerSide: number,
  halfWidth: number,
  halfLength: number
): number[] {
  const angles: number[] = [];

  // Corner angles (where the rectangle corners are)
  const cornerAngle = Math.atan2(halfLength, halfWidth);
  const cornerAngles = [
    cornerAngle, // Top-right
    Math.PI - cornerAngle, // Top-left
    Math.PI + cornerAngle, // Bottom-left
    2 * Math.PI - cornerAngle, // Bottom-right
  ];

  // Generate angles for each side, ensuring corners are included
  const sideAngles = [
    { start: 0, end: cornerAngles[0] },
    { start: cornerAngles[0], end: cornerAngles[1] },
    { start: cornerAngles[1], end: cornerAngles[2] },
    { start: cornerAngles[2], end: cornerAngles[3] },
    { start: cornerAngles[3], end: 2 * Math.PI },
  ];

  for (const side of sideAngles) {
    const sideLength = side.end - side.start;
    // More segments for longer sides
    const numSegments = Math.max(
      2,
      Math.round((sideLength / (Math.PI / 2)) * segmentsPerSide)
    );

    for (let j = 0; j < numSegments; j++) {
      const t = j / numSegments;
      angles.push(side.start + t * sideLength);
    }
  }

  // Add final angle to close the loop
  angles.push(2 * Math.PI);

  return angles;
}
