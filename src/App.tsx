import { FC, useEffect, useRef } from "react";
import {
  createProgramFromSources,
  resizeCanvasToDisplaySize,
  setGeometry,
  setRectangle,
} from "./utils";
import m3 from "./utils/m3";

const vertexGlsl = `
  attribute vec2 a_position;
  
  uniform vec2 u_resolution;
  uniform mat3 u_matrix;

  void main() {
    gl_Position = vec4((u_matrix * vec3(a_position, 1)).xy, 0, 1);
  }
`;
const fragmentGlsl = `
  precision mediump float;

  uniform vec4 u_color;

  void main() {
    gl_FragColor = u_color;
  }
`;

const render = (gl: WebGLRenderingContext, image: HTMLImageElement) => {
  const program = createProgramFromSources(gl, [vertexGlsl, fragmentGlsl]);

  if (!program) return;
  // locations
  const positionLocation = gl.getAttribLocation(program, "a_position");
  const texcoordLocation = gl.getAttribLocation(program, "a_texCoord");
  const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
  const texturesizeLocation = gl.getUniformLocation(program, "u_textureSize");
  const kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
  const kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");

  // set value
  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  setRectangle(gl, 0, 0, image.width, image.height);

  const texcoordBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]),
    gl.STATIC_DRAW
  );

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // set paramter
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(texcoordLocation);
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
  gl.vertexAttribPointer(texcoordLocation, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(resolutionLocation, gl.canvas.width, gl.canvas.height);
  gl.uniform2f(texturesizeLocation, image.width, image.height);

  const edgeDetectKernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

  const weight =
    edgeDetectKernel.reduce((prev, current) => prev + current, 0) || 1;

  gl.uniform1fv(kernelLocation, edgeDetectKernel);

  gl.uniform1f(kernelWeightLocation, weight);

  gl.drawArrays(gl.TRIANGLES, 0, 6);
};

const main = (gl: WebGLRenderingContext) => {
  const program = createProgramFromSources(gl, [vertexGlsl, fragmentGlsl]);
  if (!program) return;

  // locations
  const positionLoc = gl.getAttribLocation(program, "a_position");
  const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
  const colorLoc = gl.getUniformLocation(program, "u_color");
  const matrixLoc = gl.getUniformLocation(program, "u_matrix");

  // buffer
  const positionBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);
  // put geometry data into buffer
  setGeometry(gl);

  const translation = [100, 150];
  const angleInRadian = 0;
  const scale = [1, 1];
  const color = [Math.random(), Math.random(), Math.random(), 1];

  drawScene(gl);

  function drawScene(gl: WebGLRenderingContext) {
    resizeCanvasToDisplaySize(gl.canvas as HTMLCanvasElement);

    // tell webgl how to convert from clip to pixel
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // clear
    gl.clear(gl.COLOR_BUFFER_BIT);

    gl.useProgram(program);

    // turn on the attribute
    gl.enableVertexAttribArray(positionLoc);
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

    // set resolution
    gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

    gl.uniform4fv(colorLoc, color);

    // matrix
    const transMatrix = m3.translation(translation[0], translation[1]);
    const rotationMatrix = m3.rotation(angleInRadian);
    const scaleMatrix = m3.scaling(scale[0], scale[1]);
    const projectionMatrix = m3.projection(
      (gl.canvas as HTMLCanvasElement).clientWidth,
      (gl.canvas as HTMLCanvasElement).clientHeight
    );

    // multiply
    let matrix = m3.multiply(projectionMatrix, transMatrix);
    matrix = m3.multiply(matrix, rotationMatrix);
    matrix = m3.multiply(matrix, scaleMatrix);

    gl.uniformMatrix3fv(matrixLoc, false, matrix);

    gl.drawArrays(gl.TRIANGLES, 0, 18);
  }
};

const App: FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;

    main(ref.current.getContext("webgl")!);
  });
  return <canvas ref={ref} width={400} height={300}></canvas>;
};
export default App;
