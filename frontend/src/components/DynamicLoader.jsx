import React, { useEffect, useState } from "react";
import "./DynamicLoader.css";

const DESKTOP_DESIGNS = [
  "fabric",
  "gold",
  "flower",
  "thread",
  "luxury",
];

const MOBILE_DESIGNS = [
  "fabric",
  "gold",
  "flower",
  "thread",
  "luxury",
];

function getRandomDesign(list, previous = null) {
  if (list.length === 1) return list[0];

  let next;

  do {
    next = list[Math.floor(Math.random() * list.length)];
  } while (next === previous);

  return next;
}

function DynamicLoader() {
  const [isMobile, setIsMobile] = useState(
    window.innerWidth <= 768
  );

  const [design, setDesign] = useState(null);

  // Detect mobile / desktop
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Select first random design
 useEffect(() => {
  const designs = isMobile
    ? MOBILE_DESIGNS
    : DESKTOP_DESIGNS;

  const interval = setInterval(() => {
    setDesign((previous) =>
      getRandomDesign(designs, previous)
    );
  }, 3000);

  return () => clearInterval(interval);
}, [isMobile]);
  // Change loading design every 3 seconds
  useEffect(() => {
    if (!design) return;

    const designs = isMobile
      ? MOBILE_DESIGNS
      : DESKTOP_DESIGNS;

    const interval = setInterval(() => {
      setDesign((previous) =>
        getRandomDesign(designs, previous)
      );
    }, 3000);

    return () => clearInterval(interval);
  }, [isMobile, design]);

  if (!design) return null;

  return (
    <div className="dynamic-loader">

      {design === "fabric" && (
        <FabricLoader />
      )}

      {design === "gold" && (
        <GoldLoader />
      )}

      {design === "flower" && (
        <FlowerLoader />
      )}

      {design === "thread" && (
        <ThreadLoader />
      )}

      {design === "luxury" && (
        <LuxuryLoader />
      )}

    </div>
  );
}


/* =====================================================
   DESIGN 1 — SAREE / FABRIC
===================================================== */

function FabricLoader() {
  return (
    <div className="loader-design fabric-loader">

      <div className="fabric-wave">
        <span></span>
        <span></span>
        <span></span>
      </div>

      <h2>Arzoo Saree</h2>

      <p>Preparing something beautiful...</p>

      <div className="loader-line">
        <div></div>
      </div>

    </div>
  );
}


/* =====================================================
   DESIGN 2 — GOLD PREMIUM
===================================================== */

function GoldLoader() {
  return (
    <div className="loader-design gold-loader">

      <div className="gold-circle">
        ✦
      </div>

      <h2>ARZOO</h2>

      <p>Loading premium collection</p>

      <div className="gold-dots">
        <span></span>
        <span></span>
        <span></span>
      </div>

    </div>
  );
}


/* =====================================================
   DESIGN 3 — FLOWER
===================================================== */

function FlowerLoader() {
  return (
    <div className="loader-design flower-loader">

      <div className="flower">
        🌼
      </div>

      <h2>Grace in every thread</h2>

      <p>Bringing your sarees...</p>

      <div className="flower-loader-bar">
        <div></div>
      </div>

    </div>
  );
}


/* =====================================================
   DESIGN 4 — THREAD / WEAVING
===================================================== */

function ThreadLoader() {
  return (
    <div className="loader-design thread-loader">

      <div className="threads">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      <h2>Weaving elegance...</h2>

      <p>Please wait</p>

    </div>
  );
}


/* =====================================================
   DESIGN 5 — LUXURY GLASS
===================================================== */

function LuxuryLoader() {
  return (
    <div className="loader-design luxury-loader">

      <div className="luxury-card">

        <div className="luxury-logo">
          A
        </div>

        <h2>ARZOO</h2>

        <p>
          Traditional • Elegant • Timeless
        </p>

        <div className="luxury-progress">
          <div></div>
        </div>

      </div>

    </div>
  );
}


export default DynamicLoader;