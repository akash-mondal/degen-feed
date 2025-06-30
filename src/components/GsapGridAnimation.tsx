import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { Draggable } from 'gsap/Draggable';
import { InertiaPlugin } from 'gsap/InertiaPlugin';
import { MorphSVGPlugin } from 'gsap/MorphSVGPlugin';
import { DrawSVGPlugin } from 'gsap/DrawSVGPlugin';
import { SplitText } from 'gsap/SplitText';

const GsapGridAnimation: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    
    gsap.registerPlugin(Draggable, InertiaPlugin, MorphSVGPlugin, DrawSVGPlugin, SplitText);
    
    const ctx = gsap.context(() => {
      // --- ALL TILE ANIMATIONS ---
      
      const handleEyeFollow = (e: MouseEvent) => {
        gsap.to(".eye", {
          x: (e.clientX / window.innerWidth) * 20 - 10,
          y: (e.clientY / window.innerHeight) * 20 - 10,
          duration: 0.5,
          ease: "power2.out"
        });
      };
      document.addEventListener("mousemove", handleEyeFollow);
      
      gsap.timeline({ repeat: -1, yoyo: true }).to(".star", { rotate: 180, stagger: 0.1, duration: 1, ease: "power2.inOut" }).to(".star", { scale: 1.5, duration: 0.5, ease: "power2.inOut", stagger: 0.1 }, "-=0.5");
      gsap.to("#circles", { y: -200, duration: 1.5, ease: "none", repeat: -1 });
      gsap.to(".circle", { rotate: 360, transformOrigin: "50% 50%", duration: 3, repeat: -1, ease: "none" });
      
      const morphBoxes = gsap.utils.toArray<HTMLElement>(".morph-box");
      morphBoxes.forEach((box, i) => {
        gsap.to(box, { morphSVG: `#morph-shape-${i + 1}`, duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.1 });
        gsap.to(`#box-top-${i + 1}`, { y: 19, x: 19, duration: 1, repeat: -1, yoyo: true, ease: "sine.inOut", delay: i * 0.1 });
      });

      const halfCircleTl = gsap.timeline({ repeat: -1, yoyo: true }).timeScale(0.8);
      halfCircleTl.to("#half-circle-1", { x: -50, ease: "sine.inOut", duration: 1 }).to("#half-circle-2", { x: -50, ease: "sine.inOut", duration: 1 }, "<");

      gsap.to("#morph-heart", { morphSVG: "#morph-lip", duration: 2, ease: "power3.inOut", repeat: -1, yoyo: true });
      
      gsap.set(".square-stroke", { drawSVG: "0%" });
      gsap.to(".square-stroke", { drawSVG: "100%", duration: 1.5, repeat: -1, yoyo: true, ease: "power1.inOut", stagger: 0.2 });

      gsap.to(".random-circle", { scale: 0, transformOrigin: "center", duration: 1, repeat: -1, yoyo: true, stagger: { each: 0.2, from: "random" }});
      
      gsap.to(".bar", { y: -5, duration: 1, ease: "power1.inOut", repeat: -1, yoyo: true, stagger: 1 });
      gsap.to("#bar-1", { morphSVG: "#morph-bar-1", duration: 1, ease: "power3.inOut", repeat: -1, yoyo: true });
      gsap.to("#bar-2", { morphSVG: "#morph-bar-2", duration: 3, ease: "sine.inOut", repeat: -1, yoyo: true });
      gsap.to("#bar-3", { morphSVG: "#morph-bar-3", duration: 2, ease: "circ", repeat: -1, yoyo: true });

      gsap.to("#disk", { rotation: 360, transformOrigin: "50% 50%", duration: 5, repeat: -1, ease: "none" });

      const arrowTL = gsap.timeline({ repeat: -1 });
      arrowTL.to("#arrow-1", { y: -50, duration: 1, ease: "power3.inOut" }).to("#arrow-2", { y: -50, duration: 1, ease: "power3.inOut" }, "<");
      
      const line = document.querySelector("#lines");
      if (line) {
        gsap.set(gsap.utils.toArray(".line", line), { drawSVG: "100% 0%" });
        gsap.to(gsap.utils.toArray(".line", line), { rotate: "+=360", ease: "power3.inOut", repeat: -1, stagger: 0.1, duration: 4 });
        gsap.to(gsap.utils.toArray(".line", line), { drawSVG: "100% 50%", duration: 2, ease: "power3.inOut", repeat: -1, yoyo: true, stagger: 0.1 });
      }

      gsap.to(".ellipse", { y: 50, fill: "#5F79FF", ease: "power3.inOut", stagger: 0.1, repeat: -1, duration: 1, yoyo: true });
      gsap.to(".ball", { x: 50, stagger: 0.05, ease: "sine.inOut", repeat: -1, yoyo: true, duration: 2 });
      
      const title = containerRef.current?.querySelector(".title");
      let split: SplitText | null = null;
      if(title) {
        split = new SplitText(title, { type: "chars, words" });
        gsap.from(split.chars, { duration: 0.8, y: 80, stagger: 0.05, ease: "back.out" });
      }

      // --- DRAGGABLE GRID LOGIC ---
      const colSize = 80;
      const rowSize = 80;
      const gridRows = 4;
      const gridColumns = 4;

      let listItems = gsap.utils.toArray<HTMLElement>(".box").sort(() => 0.5 - Math.random());
      let sortables = listItems.map((element, index) => Sortable(element, index));
      
      gsap.to(containerRef.current, { autoAlpha: 1, duration: 0.5 });
      
      function changeIndex(item: any, to: number) {
        if (to >= sortables.length || to < 0) return;
        arrayMove(sortables, item.index, to);
        sortables.forEach((sortable, index) => sortable.setIndex(index));
      }

      function Sortable(element: HTMLElement, index: number) {
        let animation = gsap.to(element, { duration: 0.3, boxShadow: "rgba(0,0,0,0.2) 0px 16px 32px 0px", force3D: true, scale: 1.05, paused: true });
        let dragger = new Draggable(element, {
          onDragStart: () => animation.play(),
          onRelease: function() { animation.reverse(); layout(); },
          onDrag: function() {
            let col = Math.round(this.x / colSize);
            let row = Math.round(this.y / rowSize);
            let newIndex = gridColumns * row + col;
            if (newIndex !== sortable.index) {
              changeIndex(sortable, newIndex);
            }
          }
        });
        
        let sortable = {
          dragger: dragger,
          element: element,
          index: index,
          setIndex: (newIndex: number) => {
            sortable.index = newIndex;
            if (!dragger.isDragging) layout();
          }
        };
        
        function layout() {
          let x = (sortable.index % gridColumns) * colSize;
          let y = Math.floor(sortable.index / gridColumns) * rowSize;
          gsap.to(element, { duration: 0.3, x: x, y: y, ease: 'power2.out' });
        }
        
        gsap.set(element, {
          x: (index % gridColumns) * colSize,
          y: Math.floor(index / gridColumns) * rowSize
        });
        
        return sortable;
      }
      
      function arrayMove(array: any[], from: number, to: number) {
        array.splice(to, 0, array.splice(from, 1)[0]);
      }
    }, containerRef); 
    
    // Cleanup function
    return () => {
      ctx.revert(); // Reverts all GSAP animations, listeners, and plugins created within the context
    };
  }, []);

  return (
    <>
      <style>{`
        .gsap-animation-container {
          --color-blue: #5F79FF;
          --color-white: #FFFFFF;
          --color-black: #000000;
          --color-red: #5F79FF;      /* Mapped to new blue */
          --color-yellow: #FFFFFF;   /* Mapped to new white */
          --box-size: 80px;
          padding: 8px;
          background-color: transparent;
          border: none;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          gap: 8px;
          transform: scale(0.9);
          margin-top: -30px;
          margin-bottom: -15px;
        }
        .gsap-animation-container .title_container { display: flex; justify-content: space-between; align-items: end; }
        .gsap-animation-container .title {
          font-size: 1.25rem;
          line-height: 1.25rem;
          font-weight: 600;
          letter-spacing: -0.5px;
          color: var(--color-black);
          margin: 0;
          font-family: "Josefin Sans", sans-serif;
        }
        #grid_container {
          position: relative;
          width: calc(var(--box-size) * 4);
          height: calc(var(--box-size) * 4);
        }
        .box {
          opacity: 1;
          position: absolute;
          top: 0;
          left: 0;
          width: var(--box-size);
          height: var(--box-size);
          overflow: hidden;
          cursor: grab;
        }
        .box:active { cursor: grabbing; }
        .box-content { height: 100%; background-color: transparent; }
        .dark .gsap-animation-container .title { color: var(--color-white); }
        .dark .gsap-animation-container svg path[fill="var(--color-black)"] { fill: var(--color-white); }
      `}</style>
      <div className="gsap-animation-container" ref={containerRef}>
        <div id="grid_container">
          {/* This JSX is now a complete 1-to-1 mapping of the original HTML grid */}
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><clipPath id="clip-mask-1"><path fill="none" d="M95.86 50S75.33 79.47 50 79.47 4.14 50 4.14 50 24.67 20.53 50 20.53 95.86 50 95.86 50Z" /></clipPath></defs><path fill="var(--color-blue)" d="M0 0h100v100H0z" /><g className="eye"><path fill="var(--color-white)" d="M95.86 50S75.33 79.47 50 79.47 4.14 50 4.14 50 24.67 20.53 50 20.53 95.86 50 95.86 50Z" /><g clip-path="url(#clip-mask-1)"><circle className="eye-pupil" cx="50" cy="50" r="20.91" fill="var(--color-black)" /></g></g></svg></div></div>
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="var(--color-blue)" d="M0 0h100v100H0z" /><path className="star" d="M42.74 25.48c-10.29 0-18.64-8.34-18.64-18.64 0 10.29-8.34 18.64-18.64 18.64 10.29 0 18.64 8.34 18.64 18.64 0-10.29 8.34-18.64 18.64-18.64Z" fill="var(--color-white)" /><path className="star" d="M94.54 25.48c-10.29 0-18.64-8.34-18.64-18.64 0 10.29-8.34 18.64-18.64 18.64 10.29 0 18.64 8.34 18.64 18.64 0-10.29 8.34-18.64 18.64-18.64Z" fill="var(--color-white)" /><path className="star" d="M42.74 74.52c-10.29 0-18.64-8.34-18.64-18.64 0 10.29-8.34 18.64-18.64 18.64 10.29 0 18.64 8.34 18.64 18.64 0-10.29 8.34-18.64 18.64-18.64Z" fill="var(--color-white)" /><path className="star" d="M94.54 74.52c-10.29 0-18.64-8.34-18.64-18.64 0 10.29-8.34 18.64-18.64 18.64 10.29 0 18.64 8.34 18.64 18.64 0-10.29 8.34-18.64 18.64-18.64Z" fill="var(--color-white)" /></svg></div></div>
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"><defs><clipPath id="clip-a"><path fill="none" d="M0 0h100v100H0z" /></clipPath></defs><path fill="var(--color-blue)" d="M0 0h100v100H0z" /><g clip-path="url(#clip-a)"><g id="circles"><g className="circle"><circle cx="50" cy="50" r="50" fill="var(--color-white)" /><path d="M100 50c0 27.61-22.39 50-50 50V0c27.61 0 50 22.39 50 50Z" fill="var(--color-black)" /></g><g className="circle"><circle cx="50" cy="250" r="50" fill="var(--color-white)" /><path d="M100 250c0 27.61-22.39 50-50 50V200c27.61 0 50 22.39 50 50Z" fill="var(--color-black)" /></g><g className="circle"><circle cx="50" cy="150" r="50" fill="var(--color-white)" /><path d="M0 150c0-27.61 22.39-50 50-50v100c-27.61 0-50-22.39-50-50Z" fill="var(--color-black)" /></g></g></g></svg></div></div>
          <div className="box"><div className="box-content"><svg id="morph-boxes" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="var(--color-blue)" d="M0 0h100v100H0z" /><path id="morph-box-1" className="morph-box" d="M28.88 8.4H9.87v19.01l19.01 19.01h19.01V27.41L28.88 8.4z" fill="var(--color-black)" /><path id="box-top-1" d="M9.87 8.4h19.01v19.01H9.87z" fill="var(--color-white)" /><path id="morph-box-2" className="morph-box" d="M73.18 8.4H54.17v19.01l19.01 19.01h19.01V27.41L73.18 8.4z" fill="var(--color-black)" /><path id="box-top-2" d="M54.17 8.4h19.01v19.01H54.17z" fill="var(--color-white)" /><path id="morph-box-3" className="morph-box" d="M28.88 53.58H9.87v19.01L28.88 91.6h19.01V72.59L28.88 53.58z" fill="var(--color-black)" /><path id="box-top-3" d="M9.87 53.58h19.01v19.01H9.87z" fill="var(--color-white)" /><path id="morph-box-4" className="morph-box" d="M73.18 53.58H54.17v19.01L73.18 91.6h19.01V72.59L73.18 53.58z" fill="var(--color-black)" /><path id="box-top-4" d="M54.17 53.58h19.01v19.01H54.17z" fill="var(--color-white)" /><g className="morph-shapes"><polygon id="morph-shape-4" points="92.19 72.59 73.18 72.59 73.18 91.6 73.18 91.6 92.19 91.6 92.19 72.59 92.19 72.59" fill="none" /><polygon id="morph-shape-2" points="92.19 27.41 73.18 27.41 73.18 46.42 73.18 46.42 92.19 46.42 92.19 27.41 92.19 27.41" fill="none" /><polygon id="morph-shape-1" points="47.89 27.41 28.88 27.41 28.88 46.42 28.88 46.42 47.89 46.42 47.89 27.41 47.89 27.41" fill="none" /><polygon id="morph-shape-3" points="47.89 72.59 28.88 72.59 28.88 91.6 28.88 91.6 47.89 91.6 47.89 72.59 47.89 72.59" fill="none" /></g></svg></div></div>
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="var(--color-yellow)" d="M0 0h100v100H0z" /><g id="half-circles"><path id="half-circle-1" d="M0 50C0 22.39 22.39 0 50 0v100C22.39 100 0 77.61 0 50Z" fill="var(--color-blue)" /><path id="half-circle-2" d="M50 50c0-27.61 22.39-50 50-50v100c-27.61 0-50-22.39-50-50Z" fill="var(--color-blue)" /></g></svg></div></div>
          <div className="box"><div className="box-content"><svg id="following-stars" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="var(--color-red)" d="M0 0h100v100H0z" /><path className="rotating-star" fill="var(--color-white)" d="M100 50C72.39 50 50 27.61 50 0c0 27.61-22.39 50-50 50 27.61 0 50 22.39 50 50 0-27.61 22.39-50 50-50Z" /></svg></div></div>
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="var(--color-red)" d="M0 0h100v100H0z" /><path id="morph-heart" fill="var(--color-white)" d="M50 15.05c-10.76-10.76-28.22-10.76-38.98 0C.25 25.82.25 43.27 11.02 54.04L50 93.02l38.98-38.98c10.76-10.76 10.76-28.22 0-38.98C78.22 4.3 60.76 4.3 50 15.06Z" /><path id="morph-lip" fill="none" d="M89.74 42.61c-7-7.47-15.48-21.85-28.55-21.85-7.61 0-8.85 6.26-11.18 6.26s-3.58-6.26-11.18-6.26c-13.07 0-21.55 14.38-28.55 21.85-2.98 3.18-7.67 6.22-7.67 6.22s3.22 2.02 5.78 4.61c6.88 6.98 21.46 25.41 41.62 25.8 20.16-.39 34.75-18.82 41.62-25.8 2.56-2.6 5.78-4.61 5.78-4.61s-4.69-3.04-7.67-6.22Z" /></svg></div></div>
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="var(--color-yellow)" d="M0 0h100v100H0z" /><path className="square-stroke" d="M21.25 0v50c0 15.88 12.87 28.75 28.75 28.75S78.75 65.88 78.75 50" fill="none" stroke="var(--color-blue)" strokeMiterlimit="10" strokeWidth="10" /><path className="square-stroke" d="M28.88 0v50c0 11.66 9.46 21.12 21.12 21.12S71.12 61.66 71.12 50" fill="none" stroke="var(--color-white)" strokeMiterlimit="10" strokeWidth="10" /><path className="square-stroke" d="M36.51 0v50c0 7.45 6.04 13.49 13.49 13.49S63.49 57.45 63.49 50" fill="none" stroke="var(--color-red)" strokeMiterlimit="10" strokeWidth="10" /></svg></div></div>
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path d="M0 0h100v100H0z" fill="var(--color-yellow)" /><circle className="random-circle" cx="50" cy="50" r="50" fill="var(--color-white)" /><circle className="random-circle" cx="50" cy="50" r="40" fill="var(--color-blue)" /><circle className="random-circle" cx="50" cy="50" r="30" fill="var(--color-red)" /></svg></div></div>
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="var(--color-white)" d="M0 0h100v100H0z" /><g className="bar"><path id="bar-1" d="M71.97 6.27c-6.07 0-10.98 4.92-10.98 10.98v52.27c0 6.07 4.92 10.98 10.98 10.98s10.98-4.92 10.98-10.98V17.25c0-6.07-4.92-10.98-10.98-10.98Z" fill="var(--color-red)" /><circle id="bar-1-circle-1" cx="71.97" cy="17.25" r="10.98" fill="var(--color-blue)" /><circle cx="71.97" cy="69.52" r="10.98" fill="var(--color-yellow)" /><path id="morph-bar-1" d="M71.97 48.56c-6.07 0-10.98 4.92-10.98 10.98v9.98c0 6.07 4.92 10.98 10.98 10.98s10.98-4.92 10.98-10.98v-9.98c0-6.07-4.92-10.98-10.98-10.98Z" fill="none" /></g><g className="bar"><path id="bar-2" d="M50 22.42c-6.07 0-10.98 4.92-10.98 10.98v52.27c0 6.07 4.92 10.98 10.98 10.98s10.98-4.92 10.98-10.98V33.4c0-6.07-4.92-10.98-10.98-10.98Z" fill="var(--color-blue)" /><circle cx="50" cy="33.41" r="10.98" fill="var(--color-yellow)" /><circle id="bar-2-circle-2" cx="50" cy="85.68" r="10.98" fill="var(--color-black)" /><path id="morph-bar-2" d="M50.06 22.42c-6.07 0-10.98 4.92-10.98 10.98v9.98c0 6.07 4.92 10.98 10.98 10.98s10.98-4.92 10.98-10.98V33.4c0-6.07-4.92-10.98-10.98-10.98Z" fill="none" /></g><g className="bar"><path id="bar-3" d="M28.15 7.27c-6.07 0-10.98 4.92-10.98 10.98v52.27c0 6.07 4.92 10.98 10.98 10.98s10.98-4.92 10.98-10.98V18.26c0-6.07-4.92-10.98-10.98-10.98Z" fill="var(--color-red)" /><circle id="bar-3-circle-1" cx="28.15" cy="18.26" r="10.98" fill="var(--color-black)" /><circle cx="28.15" cy="70.53" r="10.98" fill="var(--color-blue)" /><path id="morph-bar-3" fill="none" d="M27.86 37.18c-6.06.09-10.81 5.31-10.81 11.38v22.01c0 6.07 4.74 11.28 10.81 11.38 6.15.1 11.16-4.86 11.16-10.98v-22.8c0-6.12-5.01-11.08-11.16-10.98Z" /></g></svg></div></div>
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="var(--color-white)" d="M0 0h100v100H0z" /><g id="disk"><path fill="none" d="M0 0h100v100H0z" /><path fill="var(--color-blue)" d="M100 50c0 27.61-22.39 50-50 50S0 77.61 0 50h100Z" /></g><circle cx="50" cy="50" r="25" fill="var(--color-black)" /></svg></div></div>
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 200"><defs><clipPath id="clip-b"><path fill="none" d="M0 0h100v100H0z" /></clipPath></defs><g clip-path="url(#clip-b)"><path id="arrow-1" d="M50 0 0 50h100L50 0z" fill="var(--color-red)" /><path id="arrow-2" d="M50 50 0 100h100L50 50z" fill="var(--color-black)" /><path id="arrow-3" d="M50 100 0 150h100l-50-50z" fill="var(--color-red)" /><path id="arrow-4" d="M50 150 0 200h100l-50-50z" fill="var(--color-black)" /></g></svg></div></div>
          <div className="box"><div className="box-content"><svg id="lines" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="var(--color-white)" width="100" height="100" /><path className="line" fill="none" stroke="var(--color-blue)" strokeMiterlimit="10" strokeWidth="1" strokeLinecap="round" d="M50 9.95v80.32" /><path className="line" fill="none" stroke="var(--color-blue)" strokeMiterlimit="10" strokeWidth="1" strokeLinecap="round" d="M50 9.95v80.32" /></svg></div></div>
          <div className="box"><div className="box-content"><svg id="ellipse" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="var(--color-yellow)" d="M0 0h100v100H0z" /><ellipse className="ellipse" cx="50" cy="25" fill="var(--color-white)" rx="50" ry="25" /><ellipse className="ellipse" cx="50" cy="25" fill="var(--color-white)" rx="50" ry="25" /></svg></div></div>
          <div className="box"><div className="box-content"><svg id="balancing-balls" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><clipPath id="ball-mask"><path fill="none" d="M0 0h100v100H0z" /></clipPath></defs><path fill="var(--color-red)" d="M0 0h100v100H0z" /><g clip-path="url(#ball-mask)"><circle className="ball" id="balance-ball-1" cx="50" cy="87" r="13" fill="var(--color-white)" /><circle className="ball" id="balance-ball-2" cx="50" cy="54" r="19" fill="var(--color-black)" /><circle className="ball" id="balance-ball-3" cx="50" cy="0" r="35" fill="var(--color-yellow)" /></g></svg></div></div>
          <div className="box"><div className="box-content"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><clipPath id="clip-mask-2"><path fill="none" d="M95.86 50S75.33 79.47 50 79.47 4.14 50 4.14 50 24.67 20.53 50 20.53 95.86 50 95.86 50Z" /></clipPath></defs><path fill="var(--color-red)" d="M0 0h100v100H0z" /><g className="eye"><path fill="var(--color-white)" d="M95.86 50S75.33 79.47 50 79.47 4.14 50 4.14 50 24.67 20.53 50 20.53 95.86 50 95.86 50Z" /><g clip-path="url(#clip-mask-2)"><circle className="eye-pupil" cx="50" cy="50" r="20.91" fill="var(--color-black)" /></g></g></svg></div></div>
        </div>
        <div>
          <div className="title_container">
            <p className="title">Powered by Openserv AI Agents</p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GsapGridAnimation;
