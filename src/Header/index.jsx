import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import "./styles.css";

const Header = ({ introComplete = false }) => {
  const images = useMemo(
    () => [
      "https://storage.googleapis.com/slicker/demo/SLICKER_FOOD_01.jpg",
      "https://storage.googleapis.com/slicker/demo/SLICKER_FOOD_02.jpg",
      "https://storage.googleapis.com/slicker/demo/SLICKER_FOOD_03.jpg",
      "https://storage.googleapis.com/slicker/demo/SLICKER_FOOD_04.jpg",
      "https://storage.googleapis.com/slicker/demo/SLICKER_FOOD_05.jpg",
      "https://storage.googleapis.com/slicker/demo/SLICKER_FOOD_06.jpg",
      "https://storage.googleapis.com/slicker/demo/SLICKER_FOOD_07.jpg",
      "https://storage.googleapis.com/slicker/demo/SLICKER_FOOD_08.jpg",
      "https://storage.googleapis.com/slicker/demo/SLICKER_FOOD_09.jpg",
    ],
    []
  );

  const interval = 200;
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [animationStarted, setAnimationStarted] = useState(false);
  const isAtEnd = currentImageIndex >= images.length - 1;

  // Preload images
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // Start animation only after intro is complete
  useEffect(() => {
    if (introComplete && !animationStarted) {
      setAnimationStarted(true);
      setCurrentImageIndex(0); // Reset to first image when starting
    }
  }, [introComplete, animationStarted]);

  // Cycle through images once (no loop) - only after animation has started
  useEffect(() => {
    if (!animationStarted || images.length === 0 || isHovered || isAtEnd)
      return;

    const timer = setInterval(() => {
      setCurrentImageIndex((prev) => {
        const next = prev + 1;
        return next >= images.length ? images.length - 1 : next;
      });
    }, interval);
    return () => clearInterval(timer);
  }, [animationStarted, images.length, interval, isHovered, isAtEnd]);

  const currentUrl = images[currentImageIndex];

  // Before intro completes, show white text
  const showWhiteText = !animationStarted || isAtEnd;

  return (
    <div className="header-container">
      <header
        style={{
          backgroundColor: "transparent",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100px",
        }}
      >
        <Link
          to="/"
          className="headerText"
          style={{
            ...(showWhiteText
              ? {
                  color: "white",
                  WebkitTextFillColor: "white",
                }
              : {
                  backgroundImage: `url(${currentUrl})`,
                  backgroundPosition: "center",
                  backgroundSize: "cover",
                  backgroundRepeat: "no-repeat",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  color: "transparent",
                  WebkitTextFillColor: "transparent",
                }),
            display: "inline-block",
            lineHeight: 1,
            fontSize: "4rem",
            fontWeight: "bold",
            textAlign: "center",
            willChange: "background-image",
            textDecoration: "none",
            cursor: "pointer",
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          SLICKER
        </Link>
      </header>

      <nav
        className="header-nav"
        style={{
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          gap: "4rem",
          marginTop: "1rem",
        }}
      >
        <Link to="/fashion" className="nav-link">
          Fashion
        </Link>
        <Link to="/music" className="nav-link">
          Music
        </Link>
        <Link to="/Graffiti" className="nav-link">
          Graffiti
        </Link>
        <Link to="/food" className="nav-link">
          Food
        </Link>
        <Link to="/experimental" className="nav-link">
          Experimental
        </Link>
      </nav>
    </div>
  );
};

export default Header;
