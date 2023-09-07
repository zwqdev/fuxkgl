import { FC, useEffect, useRef } from "react";
import { createProgramFromSources, resizeCanvasToDisplaySize } from "./utils";

const vertexGlsl = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;

  uniform vec2 u_resolution;
  varying vec2 v_texCoord;

  void main() {
    vec2 zerotoone = a_position / u_resolution;
    vec2 zerototwo = zerotoone * 2.0;
    vec2 clipspace = zerototwo - 1.0;
    gl_Position = vec4(clipspace * vec2(1, -1), 0, 1);

    v_texCoord = a_texCoord;
  }
`;
const fragmentGlsl = `
  precision mediump float;

  uniform sampler2D u_image;
  varying vec2 v_texCoord;
  uniform vec2 u_textureSize;
  uniform float u_kernel[9];
  uniform float u_kernelWeight;

  void main() {
    vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
    vec4 colorSum =
     texture2D(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
     texture2D(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
     texture2D(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
     texture2D(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
     texture2D(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
     texture2D(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
     texture2D(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
     texture2D(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
     texture2D(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;
    gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);
  }
`;

const setRectangle = (
  gl: WebGLRenderingContext,
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const x1 = x;
  const x2 = x + width;
  const y1 = y;
  const y2 = y + height;

  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([x1, y1, x2, y1, x1, y2, x1, y2, x2, y1, x2, y2]),
    gl.STATIC_DRAW
  );
};

function createAndSetupTexture(gl: WebGL2RenderingContext) {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  // 设置材质，这样我们可以对任意大小的图像进行像素操作
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  return texture;
}
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
const App: FC = () => {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    if (!ref.current) return;
    const image = new Image();
    image.src = "/public/leaves.jpg";
    image.onload = () => {
      const gl = ref.current!.getContext("webgl")!;
      render(gl, image);
    };
  });
  return <canvas ref={ref} width={400} height={300}></canvas>;
};
export default App;
