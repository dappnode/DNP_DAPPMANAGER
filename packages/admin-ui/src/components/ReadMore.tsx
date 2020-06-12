import React, { useState, useEffect, useRef } from "react";
// Icons
import { MdUnfoldMore, MdUnfoldLess } from "react-icons/md";
// Styles
import "./readMore.css";

/**
 * Fully responsive text box with a Read More label
 * It subscribes to the window size in order to show
 * "Read more" or not. It is linked to css prop:
 *   .installer-details #description.short {
 *     max-height: 121px;
 *   }
 * Which limits the height of the component to 1px extra
 * to the height of 4 lines in default font size.
 */
const ReadMore: React.FC = ({ children }) => {
  const [readMore, setReadMore] = useState(false);
  const [showReadMore, setShowReadMore] = useState(false);
  const readMoreEl = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function update() {
      if (!readMoreEl.current) return;
      const height = readMoreEl.current.clientHeight;
      setShowReadMore(height >= 121); // max-height of .description
    }
    update();
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("resize", update);
    };
  }, []);

  return (
    <div>
      <div ref={readMoreEl} className={`read-more ${readMore ? "" : "short"}`}>
        {children}
      </div>
      {showReadMore && (
        <span
          className="read-more-toggle"
          onClick={() => setReadMore(!readMore)}
        >
          {readMore ? (
            <>
              <MdUnfoldLess /> Read less
            </>
          ) : (
            <>
              <MdUnfoldMore /> Read more
            </>
          )}
        </span>
      )}
    </div>
  );
};

export default ReadMore;
