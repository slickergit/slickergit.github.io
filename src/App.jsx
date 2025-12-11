import React, { useState, useEffect, useRef } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Home from "./Home";
import Graffiti from "./Graffiti";
import Food from "./Food";
import Fashion from "./Fashion";
import Music from "./Music";
import Experimental from "./Experimental";

const App = () => {
  const [showIntro, setShowIntro] = useState(true);
  const [isFading, setIsFading] = useState(false);
  const [introComplete, setIntroComplete] = useState(false);
  const [clickToEnterDisabled, setClickToEnterDisabled] = useState(false);

  const handleIntroClick = () => {
    // Don't do anything if drawing mode is enabled or already fading
    if (clickToEnterDisabled || isFading) return;

    setIsFading(true);
    setTimeout(() => {
      setShowIntro(false);
      setIntroComplete(true);
    }, 800);
  };

  // Called when user enables drawing mode - disable click anywhere to enter
  const handleUnlock = () => {
    setClickToEnterDisabled(true);
  };

  // Called when user clicks the arrow to enter the site
  const handleEnter = () => {
    if (isFading) return;

    setIsFading(true);
    setTimeout(() => {
      setShowIntro(false);
      setIntroComplete(true);
    }, 800);
  };

  return (
    <Router>
      <div
        style={{
          backgroundColor: "black",
          minHeight: "100vh",
          minWidth: "100vw",
          margin: 0,
          padding: 0,
        }}
      >
        {/* Intro Screen */}
        {showIntro && (
          <div
            onClick={handleIntroClick}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 10000,
              opacity: isFading ? 0 : 1,
              transition: "opacity 0.8s ease-out",
              pointerEvents: isFading ? "none" : "auto",
            }}
          >
            <Experimental onUnlock={handleUnlock} onEnter={handleEnter} />
            {/* Click hint - hide when drawing is enabled */}
            {!clickToEnterDisabled && (
              <div
                style={{
                  position: "fixed",
                  bottom: "40px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  color: "rgba(255, 255, 255, 0.6)",
                  fontSize: "14px",
                  fontFamily: "sans-serif",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  pointerEvents: "none",
                  opacity: isFading ? 0 : 1,
                  transition: "opacity 0.3s ease-out",
                }}
              >
                Click anywhere to enter
              </div>
            )}
          </div>
        )}

        {/* Main Content - render but hide until intro is done for smoother transition */}
        <div
          style={{
            opacity: introComplete ? 1 : 0,
            transition: "opacity 0.5s ease-in",
            transitionDelay: introComplete ? "0.2s" : "0s",
          }}
        >
          <Header introComplete={introComplete} />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/food" element={<Food />} />
            <Route path="/graffiti" element={<Graffiti />} />
            <Route path="/fashion" element={<Fashion />} />
            <Route path="/music" element={<Music />} />
            <Route path="/experimental" element={<Experimental />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;
