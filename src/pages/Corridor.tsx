'use client';

import { useState, useRef, useLayoutEffect } from "react";
import Door from "../components/Door";
import FrontDesk from "../components/FrontDesk";
import Spacer from "../components/Spacer";

export default function Corridor() {
  const [openDoor] = useState<number>(() => Math.floor(Math.random() * 3) + 1);
  const scrollRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollLeft = el.scrollWidth - el.clientWidth;
    });
  }, []);

  return (
    <div
        id="root"
        ref={scrollRef}
        className="relative w-full h-full overflow-x-auto overflow-y-hidden"
    >
        <div className="relative w-max h-full">
            <div className="pointer-events-none absolute inset-0 z-0">
            <div className="corridor-bg-top absolute left-0 top-0 w-full h-[65%]" />
            <div className="corridor-bg-bottom absolute left-0 bottom-0 w-full h-[35%]" />
            </div>

            <div className="relative z-10 h-full flex flex-row">
            {[3, 2, 1].map((number) => (
                <div key={number} className="flex">
                <Spacer ratio={[3, 2].includes(number) ? 3 : 8} />
                <Door number={number} open={openDoor === number} />
                </div>
            ))}
            <Spacer ratio={5} />
            <FrontDesk />
            </div>
        </div>
    </div>
  );
}
