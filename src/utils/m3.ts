/*
 * Copyright 2021, GFXFundamentals.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are
 * met:
 *
 *     * Redistributions of source code must retain the above copyright
 * notice, this list of conditions and the following disclaimer.
 *     * Redistributions in binary form must reproduce the above
 * copyright notice, this list of conditions and the following disclaimer
 * in the documentation and/or other materials provided with the
 * distribution.
 *     * Neither the name of GFXFundamentals. nor the names of his
 * contributors may be used to endorse or promote products derived from
 * this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
 * "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
 * LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
 * A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
 * OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
 * SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
 * LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
 * DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
 * THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
 * OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */

let MatType = Float32Array;

type Matrix = InstanceType<typeof MatType>;
/**
 * Sets the type this library creates for a Mat3
 */
export function setDefaultType(Ctor: typeof MatType) {
  const OldType = MatType;
  MatType = Ctor;
  return OldType;
}

/**
 * Takes two Matrix3s, a and b, and computes the product in the order
 * that pre-composes b with a.  In other words, the matrix returned will
 * @memberOf module:webgl-2d-math
 */
function multiply(a: Matrix, b: Matrix, dst?: Matrix) {
  dst = dst || new MatType(9);
  const a00 = a[0 * 3 + 0];
  const a01 = a[0 * 3 + 1];
  const a02 = a[0 * 3 + 2];
  const a10 = a[1 * 3 + 0];
  const a11 = a[1 * 3 + 1];
  const a12 = a[1 * 3 + 2];
  const a20 = a[2 * 3 + 0];
  const a21 = a[2 * 3 + 1];
  const a22 = a[2 * 3 + 2];
  const b00 = b[0 * 3 + 0];
  const b01 = b[0 * 3 + 1];
  const b02 = b[0 * 3 + 2];
  const b10 = b[1 * 3 + 0];
  const b11 = b[1 * 3 + 1];
  const b12 = b[1 * 3 + 2];
  const b20 = b[2 * 3 + 0];
  const b21 = b[2 * 3 + 1];
  const b22 = b[2 * 3 + 2];

  dst[0] = b00 * a00 + b01 * a10 + b02 * a20;
  dst[1] = b00 * a01 + b01 * a11 + b02 * a21;
  dst[2] = b00 * a02 + b01 * a12 + b02 * a22;
  dst[3] = b10 * a00 + b11 * a10 + b12 * a20;
  dst[4] = b10 * a01 + b11 * a11 + b12 * a21;
  dst[5] = b10 * a02 + b11 * a12 + b12 * a22;
  dst[6] = b20 * a00 + b21 * a10 + b22 * a20;
  dst[7] = b20 * a01 + b21 * a11 + b22 * a21;
  dst[8] = b20 * a02 + b21 * a12 + b22 * a22;

  return dst;
}

/**
 * Creates a 3x3 identity matrix
 */
function identity(dst?: Matrix) {
  dst = dst || new MatType(9);
  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 1;
  dst[5] = 0;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 1;

  return dst;
}

/**
 * Creates a 2D projection matrix= 0 at the top.
 * @memberOf module:webgl-2d-math
 */
function projection(width: number, height: number, dst?: Matrix) {
  dst = dst || new MatType(9);
  // Note: This matrix flips the Y axis so 0 is at the top.

  dst[0] = 2 / width;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = -2 / height;
  dst[5] = 0;
  dst[6] = -1;
  dst[7] = 1;
  dst[8] = 1;

  return dst;
}

/**
 * Multiplies by a 2D projection matrix
 */
function project(m: Matrix, width: number, height: number, dst?: Matrix) {
  return multiply(m, projection(width, height), dst);
}

/**
 * Creates a 2D translation matrix
 * @memberOf module:webgl-2d-math
 */
function translation(tx: number, ty: number, dst?: Matrix) {
  dst = dst || new MatType(9);

  dst[0] = 1;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = 1;
  dst[5] = 0;
  dst[6] = tx;
  dst[7] = ty;
  dst[8] = 1;

  return dst;
}

/**
 * Multiplies by a 2D translation matrix
 */
function translate(m: Matrix, tx: number, ty: number, dst?: Matrix) {
  return multiply(m, translation(tx, ty), dst);
}

/**
 * Creates a 2D rotation matrix
 */
function rotation(angleInRadians: number, dst?: Matrix) {
  const c = Math.cos(angleInRadians);
  const s = Math.sin(angleInRadians);

  dst = dst || new MatType(9);

  dst[0] = c;
  dst[1] = -s;
  dst[2] = 0;
  dst[3] = s;
  dst[4] = c;
  dst[5] = 0;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 1;

  return dst;
}

/**
 * Multiplies by a 2D rotation matrix
 */
function rotate(m: Matrix, angleInRadians: number, dst?: Matrix) {
  return multiply(m, rotation(angleInRadians), dst);
}

/**
 * Creates a 2D scaling matrix
 */
function scaling(sx: number, sy: number, dst?: Matrix) {
  dst = dst || new MatType(9);

  dst[0] = sx;
  dst[1] = 0;
  dst[2] = 0;
  dst[3] = 0;
  dst[4] = sy;
  dst[5] = 0;
  dst[6] = 0;
  dst[7] = 0;
  dst[8] = 1;

  return dst;
}

/**
 * Multiplies by a 2D scaling matrix
 */
function scale(m: Matrix, sx: number, sy: number, dst?: Matrix) {
  return multiply(m, scaling(sx, sy), dst);
}

function dot(x1: number, y1: number, x2: number, y2: number) {
  return x1 * x2 + y1 * y2;
}

function distance(x1: number, y1: number, x2: number, y2: number) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

function normalize(x: number, y: number) {
  const l = distance(0, 0, x, y);
  if (l > 0.00001) {
    return [x / l, y / l];
  } else {
    return [0, 0];
  }
}

// i = incident
// n = normal
function reflect(ix: number, iy: number, nx: number, ny: number) {
  // I - 2.0 * dot(N, I) * N.
  const d = dot(nx, ny, ix, iy);
  return [ix - 2 * d * nx, iy - 2 * d * ny];
}

function radToDeg(r: number) {
  return (r * 180) / Math.PI;
}

function degToRad(d: number) {
  return (d * Math.PI) / 180;
}

function transformPoint(m: Matrix, v: number[]) {
  const v0 = v[0];
  const v1 = v[1];
  const d = v0 * m[0 * 3 + 2] + v1 * m[1 * 3 + 2] + m[2 * 3 + 2];
  return [
    (v0 * m[0 * 3 + 0] + v1 * m[1 * 3 + 0] + m[2 * 3 + 0]) / d,
    (v0 * m[0 * 3 + 1] + v1 * m[1 * 3 + 1] + m[2 * 3 + 1]) / d,
  ];
}

function inverse(m: Matrix, dst?: Matrix) {
  dst = dst || new MatType(9);

  const m00 = m[0 * 3 + 0];
  const m01 = m[0 * 3 + 1];
  const m02 = m[0 * 3 + 2];
  const m10 = m[1 * 3 + 0];
  const m11 = m[1 * 3 + 1];
  const m12 = m[1 * 3 + 2];
  const m20 = m[2 * 3 + 0];
  const m21 = m[2 * 3 + 1];
  const m22 = m[2 * 3 + 2];

  const b01 = m22 * m11 - m12 * m21;
  const b11 = -m22 * m10 + m12 * m20;
  const b21 = m21 * m10 - m11 * m20;

  const det = m00 * b01 + m01 * b11 + m02 * b21;
  const invDet = 1.0 / det;

  dst[0] = b01 * invDet;
  dst[1] = (-m22 * m01 + m02 * m21) * invDet;
  dst[2] = (m12 * m01 - m02 * m11) * invDet;
  dst[3] = b11 * invDet;
  dst[4] = (m22 * m00 - m02 * m20) * invDet;
  dst[5] = (-m12 * m00 + m02 * m10) * invDet;
  dst[6] = b21 * invDet;
  dst[7] = (-m21 * m00 + m01 * m20) * invDet;
  dst[8] = (m11 * m00 - m01 * m10) * invDet;

  return dst;
}

export default {
  degToRad: degToRad,
  distance: distance,
  dot: dot,
  identity: identity,
  inverse: inverse,
  multiply: multiply,
  normalize: normalize,
  projection: projection,
  radToDeg: radToDeg,
  reflect: reflect,
  rotation: rotation,
  rotate: rotate,
  scaling: scaling,
  scale: scale,
  transformPoint: transformPoint,
  translation: translation,
  translate: translate,
  project: project,
};
