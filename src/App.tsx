import { useEffect, useRef } from "react";
import "./App.css";

const vertexGlsl = `
  attribute vec2 a_position;
  uniform vec2 u_resolution;
  void main() {
    vec2 zeroToOne = a_position.xy / u_resolution;
    vec2 zeroToTwo = zeroToOne * 2.0;
    vec2 clipSpace = zeroToTwo - 1.0;
    gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);
  }
`;
const fragmentGlsl = `
  precision mediump float;
  uniform vec4 u_color;
  void main () {
    gl_FragColor = u_color;
  }
`;
const createShader = (
  gl: WebGLRenderingContext,
  type: number,
  source: string
) => {
  const shader = gl.createShader(type)!;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  const success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
  if (success) {
    return shader;
  }
  console.log(gl.getShaderInfoLog(shader));
  gl.deleteShader(shader);
};
const createProgram = (
  gl: WebGLRenderingContext,
  vertex: WebGLShader,
  fragment: WebGLShader
) => {
  const program = gl.createProgram()!;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  const success = gl.getProgramParameter(program, gl.LINK_STATUS);
  if (success) {
    return program;
  }
  console.log(gl.getProgramInfoLog(program));
  gl.deleteProgram(program);
};

const getRectangle = (
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

const random = (range: number) => {
  return Math.floor(Math.random() * range);
};
const draw = (gl: WebGLRenderingContext) => {
  const vertex = createShader(gl, gl.VERTEX_SHADER, vertexGlsl)!;
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentGlsl)!;
  const program = createProgram(gl, vertex, fragment)!;

  const positionLoc = gl.getAttribLocation(program, "a_position");
  const resolutionLoc = gl.getUniformLocation(program, "u_resolution");
  const colorLoc = gl.getUniformLocation(program, "u_color");

  const positionBuf = gl.createBuffer();

  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuf);

  const positions = [10, 20, 80, 20, 10, 30, 10, 30, 80, 20, 80, 30];
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

  // render
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
  // clear canvas
  gl.clearColor(0, 0, 0, 0);
  gl.clear(gl.COLOR_BUFFER_BIT);

  gl.useProgram(program);

  gl.enableVertexAttribArray(positionLoc);
  gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
  gl.uniform2f(resolutionLoc, gl.canvas.width, gl.canvas.height);

  for (let i = 0; i < 50; i++) {
    getRectangle(gl, random(300), random(300), random(300), random(200));
    gl.uniform4f(colorLoc, Math.random(), Math.random(), Math.random(), 1);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }
};
function App() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    draw(ref.current.getContext("webgl")!);
  });
  return (
    <>
      <canvas className="stage" ref={ref}></canvas>
    </>
  );
}

export default App;
