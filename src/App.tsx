import { FC, useEffect, useRef } from "react";
import { createProgramFromSources, resizeCanvasToDisplaySize } from "./utils";

const vertexGlsl = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;

  uniform vec2 u_resolution;

  varying vec2 v_texCoord;

  void main() {
    vec2 zeroToOne = a_position / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;

    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);

    v_texCoord = a_texCoord;
  }
`;
const fragmentGlsl = `
  precision mediump float;

  uniform sampler2D u_image;

  varying vec2 v_texCoord;

  void main() {
    gl_FragColor = texture2D(u_image, v_texCoord).bgra;
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
const render = (gl: WebGLRenderingContext, image: HTMLImageElement) => {
  const program = createProgramFromSources(gl, [vertexGlsl, fragmentGlsl]);
  if (!program) return;

  const positionLoc = gl.getAttribLocation(program, "a_position");
  const texcoordLoc = gl.getAttribLocation(program, "a_texCoord");

  const positionBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);
  setRectangle(gl, 0, 0, image.width, image.height);

  const texcoordBuf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuf);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      0.0, 0.0, 1.0, 0.0, 0.0, 1.0, 0.0, 1.0, 1.0, 0.0, 1.0, 1.0,
    ]),
    gl.STATIC_DRAW
  );

  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

  const resolutionLoc = gl.getUniformLocation(program, "u_resolution");

  resizeCanvasToDisplaySize(gl.canvas as unknown as HTMLCanvasElement);

  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);

  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);

  gl.enableVertexAttribArray(texcoordLoc);
  gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuf);

  gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

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
  return <canvas ref={ref}></canvas>;
};
export default App;
