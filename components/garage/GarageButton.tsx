"use client";

import dynamic from "next/dynamic";
import { useCallback, useState } from "react";

const Garage = dynamic(() => import("./Garage").then((module) => module.Garage), { ssr: false });

export function GarageButton() {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="btn-race mt-3">
        Open the garage
      </button>
      {open && <Garage onClose={close} />}
    </>
  );
}
