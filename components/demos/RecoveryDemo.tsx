"use client";

import { useState } from "react";

const attacks = [
  { label: "Attacker enters a public date of birth", vulnerable: true, secure: "Rejected: public details are never accepted." },
  { label: "Attacker enters a detail from a public profile", vulnerable: true, secure: "Rejected: public details are never accepted." },
  { label: "Attacker keeps guessing over and over", vulnerable: true, secure: "Blocked by the rate limit." },
  { label: "Attacker requests an emailed code", vulnerable: false, secure: "24-hour delay starts and the owner is notified, so they can cancel it." },
  { label: "Owner uses password plus a backup code", vulnerable: false, secure: "Recovered: the code is used up and MFA must be set up again." },
];

export function RecoveryDemo() {
  const [selected, setSelected] = useState(0);
  const attack = attacks[selected];

  return (
    <div>
      <h3 className="font-display text-3xl">Attack both versions</h3>
      <p className="mt-2 text-sm text-muted">
        Pick a move and compare the flawed design with the fix. These outcomes describe the behaviour the prototype&apos;s
        tests cover. The prototype itself is Python and isn&apos;t running here.
      </p>
      <div className="mt-4 flex flex-col gap-2">
        {attacks.map(({ label }, index) => (
          <button
            key={label}
            type="button"
            aria-pressed={selected === index}
            onClick={() => setSelected(index)}
            className="border border-line px-3 py-2 text-left text-sm hover:border-lime aria-pressed:border-lime"
          >
            {label}
          </button>
        ))}
      </div>
      <div aria-live="polite" className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="border-l-4 border-l-red p-3">
          <p className="font-mono text-xs text-muted">Flawed design</p>
          <p className="mt-1 text-sm">
            {attack.vulnerable ? "Account recovered. MFA is bypassed." : "Not the path an attacker needs: one public detail is enough."}
          </p>
        </div>
        <div className="border-l-4 border-l-green p-3">
          <p className="font-mono text-xs text-muted">Secure design</p>
          <p className="mt-1 text-sm">{attack.secure}</p>
        </div>
      </div>
    </div>
  );
}
