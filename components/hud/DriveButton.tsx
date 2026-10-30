"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getRace } from "@/lib/telemetry";
import { useLapMode } from "@/lib/useLapMode";

const DriveMode = dynamic(() => import("./DriveMode").then((module) => module.DriveMode), { ssr: false });

// Three.js only loads once someone asks to drive. The game UI sits on body because the page is hidden meanwhile
export function DriveButton() {
  const mode = useLapMode();
  const [loaded, setLoaded] = useState(false);

  const drive = useCallback(async () => {
    setLoaded(true);
    const { startDrive } = await import("@/lib/drive");
    startDrive();
  }, []);

  useEffect(() => {
    function handleKey(event: KeyboardEvent) {
      const typing = (event.target as Element).closest?.("input, textarea, select");
      if (event.code === "KeyD" && !typing && !event.metaKey && !event.ctrlKey && getRace().started) drive();
    }
    if (mode !== "full") return;
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [mode, drive]);

  if (mode !== "full") return null;

  return (
    <>
      <button type="button" onClick={drive} className="btn-race">
        Take the wheel
      </button>
      {loaded && createPortal(<DriveMode />, document.body)}
    </>
  );
}
