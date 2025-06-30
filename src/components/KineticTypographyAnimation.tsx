import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { gsap } from 'gsap';
import WebFont from 'webfontloader';

interface KineticTypographyAnimationProps {
  onComplete: () => void;
}

const vertexShader = `
  uniform mat4 modelViewMatrix;
  uniform mat4 projectionMatrix;
  uniform float time;
  uniform float index;
  uniform float divisions;
  uniform float tOffsetX;
  uniform vec4 tween;
  attribute vec3 position;
  attribute vec2 uv;
  varying vec2 vUv;

  mat2 scale2D(vec2 scale) {
    return mat2(scale.x, 0.0, 0.0, scale.y);
  }

  void main() {
    vUv = uv;
    vec3 pos = position;

    float scaleX = tween.x;
    pos.x += tOffsetX;
    pos.xy *= scale2D(vec2(scaleX, 1.0));
    pos.x -= tOffsetX;

    gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
  }
`;

const fragmentShader = `
  precision highp float;
  uniform sampler2D texture;
  uniform float time;
  uniform float index;
  uniform float divisions;
  uniform vec4 tween;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    float startV = index * (1.0 / divisions);
    vec2 tuv = vec2(uv.x, startV + uv.y * (1.0 / divisions));
    vec4 color = texture2D(texture, tuv);
    gl_FragColor = color;
  }
`;

const KineticTypographyAnimation: React.FC<KineticTypographyAnimationProps> = ({ onComplete }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    let scene: THREE.Scene;
    let camera: THREE.OrthographicCamera;
    let renderer: THREE.WebGLRenderer;
    let animationFrameId: number;

    const titleMeshes: THREE.Mesh[] = [];
    const tweens1: THREE.Vector4[] = [];
    const tweens2: THREE.Vector4[] = [];
    const tweens3: THREE.Vector4[] = [];
    
    const numDivisions = 40;
    const titleWidth = 2.0;
    const titleHeight = 0.5;

    const init = () => {
      const width = 960;
      const height = 540;
      const aspectRatio = width / height;
      const dpr = Math.min(window.devicePixelRatio, 2);
      const sceneWidth = 2;
      const sceneHeight = sceneWidth / aspectRatio;
      
      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(-sceneWidth / 2, sceneWidth / 2, sceneHeight / 2, -sceneHeight / 2, 0.01, 1000);
      camera.position.set(0, 0, 1);
      
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, canvas: canvasRef.current! });
      renderer.setSize(width, height);
      renderer.setPixelRatio(dpr);

      const texture1 = createFontTexture({ width: 1024, height: 256, fontSize: 230, text: 'never.' });
      const texture2 = createFontTexture({ width: 1024, height: 256, fontSize: 230, text: 'miss.' });
      
      // --- THIS IS THE CHANGE ---
      const texture3 = createFontTexture({ width: 1024, height: 256, fontSize: 180, text: 'a signal.' });
      // --------------------------

      createTitle({ texture: texture1, tweens: tweens1 });
      createTitle({ texture: texture2, tweens: tweens2 });
      createTitle({ texture: texture3, tweens: tweens3 });
      
      animateTitle();
      updateCanvas();
    };

    const createFontTexture = (options: { width: number, height: number, fontSize: number, text: string }) => {
      const canvas = document.createElement('canvas');
      const dpr = Math.min(window.devicePixelRatio, 2);
      const width = options.width * dpr;
      const height = options.height * dpr;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.font = `600 ${options.fontSize * dpr}px 'Muli'`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = document.documentElement.classList.contains('dark') ? '#fff' : '#000';
      ctx.fillText(options.text, width / 2, height / 2 + 25);
      const texture = new THREE.CanvasTexture(canvas);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.format = THREE.RGBAFormat;
      return texture;
    };

    const createTitle = (params: { texture: THREE.CanvasTexture, tweens: THREE.Vector4[] }) => {
      for (let i = 0; i < numDivisions; i++) {
        const dividedHeight = titleHeight / numDivisions;
        const geometry = new THREE.PlaneGeometry(titleWidth, dividedHeight);
        
        delete geometry.attributes.normal;

        const material = new THREE.RawShaderMaterial({
          uniforms: {
            texture: { value: params.texture },
            time: { value: 0 },
            index: { value: i },
            divisions: { value: numDivisions },
            tOffsetX: { value: -1.0 },
            tween: { value: new THREE.Vector4(0, 0, 1, 1) },
          },
          vertexShader,
          fragmentShader,
          transparent: true,
        });
        const y = -titleHeight * 0.5 + i * dividedHeight + dividedHeight * 0.5;
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.y = y;
        scene.add(mesh);
        titleMeshes.push(mesh);
        params.tweens.push(material.uniforms.tween.value);
      }
    };

    const animateTitle = () => {
      const tl = gsap.timeline({
        onComplete: () => {
          gsap.delayedCall(1, onComplete);
        },
        defaults: {
          ease: "power3.inOut",
          duration: 1.0,
          stagger: 0.02,
        }
      });

      const setTransformOffset = (titleIndex: number, value: number) => {
        const startIndex = titleIndex * numDivisions;
        const endIndex = startIndex + numDivisions;
        for (let i = startIndex; i < endIndex; i++) {
          titleMeshes[i].material.uniforms.tOffsetX.value = value;
        }
      };

      tl.to(tweens1, { x: 1.0, onStart: () => setTransformOffset(0, -1.0) }, 'start');
      tl.to(tweens1, { x: 0.0, onStart: () => setTransformOffset(0, 1.0) }, 'next1');
      tl.to(tweens2, { x: 1.0, onStart: () => setTransformOffset(1, -1.0) }, 'next1');
      tl.to(tweens2, { x: 0.0, onStart: () => setTransformOffset(1, 1.0) }, 'next2');
      tl.to(tweens3, { x: 1.0, onStart: () => setTransformOffset(2, -1.0) }, 'next2');
      tl.to(tweens3, { x: 0.0, onStart: () => setTransformOffset(2, 1.0) });
    };

    const updateCanvas = () => {
      animationFrameId = requestAnimationFrame(updateCanvas);
      if(renderer && scene && camera) {
        renderer.render(scene, camera);
      }
    };

    WebFont.load({
      google: { families: ['Muli:600'] },
      classes: false,
      active: init
    });
    
    return () => {
      window.cancelAnimationFrame(animationFrameId);
      gsap.killTweensOf("*");
      if (renderer) renderer.dispose();
      if (scene) {
        scene.traverse(object => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            if (object.material) {
               if (Array.isArray(object.material)) {
                 object.material.forEach(material => material.dispose());
               } else {
                 object.material.dispose();
               }
            }
          }
        });
      }
    };
  }, [onComplete]);

  return (
    <>
      <style>{`
        .kinetic-canvas-container {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: transparent;
        }
        .kinetic-canvas {
          display: block;
          max-width: 90vw;
          max-height: 90vh;
          width: auto;
          height: auto;
          aspect-ratio: 960 / 540;
        }
      `}</style>
      <div className="kinetic-canvas-container">
        <canvas ref={canvasRef} className="kinetic-canvas" />
      </div>
    </>
  );
};

export default KineticTypographyAnimation;
