"use client";

import { type FormEvent, useState } from "react";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { profile } from "@/content/profile";

const pitStopMs = 2400;

const fieldClass =
  "mt-2 w-full border border-line bg-carbon px-3 py-2.5 text-base text-ink focus:border-lime focus:outline-none";

type Status = "idle" | "sending" | "sent";

export function PitLane() {
  const [status, setStatus] = useState<Status>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form));
    setStatus("sending");

    const pitStop = new Promise((resolve) => setTimeout(resolve, pitStopMs));
    const sent = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    })
      .then((response) => response.ok)
      .catch(() => false);

    if (!sent) {
      // No email service available, so hand the message to the visitor's email app
      const subject = encodeURIComponent(`Team radio from ${data.name}`);
      const body = encodeURIComponent(String(data.message));
      setStatus("idle");
      window.location.href = `mailto:${profile.email}?subject=${subject}&body=${body}`;
      return;
    }

    await pitStop;
    form.reset();
    setStatus("sent");
  }

  return (
    <section id="pit-lane" className="px-4 py-28 sm:px-6 lg:px-10">
      <SectionHeader kicker="Pit lane · Box box" title="Open team radio" />

      <div className="reveal mt-8 grid items-start gap-4 lg:grid-cols-2">
        <p className="glass p-6 text-lg leading-relaxed sm:p-8 sm:text-xl">
          Internships, collaborations or a good argument about tyre strategy. Send a message and
          I&apos;ll radio back.
        </p>

        <form onSubmit={handleSubmit} className="glass p-5 sm:p-7">
          <label className="block font-mono text-xs text-muted">
            Your name
            <input name="name" required maxLength={100} autoComplete="name" className={fieldClass} />
          </label>
          <label className="mt-5 block font-mono text-xs text-muted">
            Your email
            <input
              name="email"
              type="email"
              required
              maxLength={200}
              autoComplete="email"
              className={fieldClass}
            />
          </label>
          <label className="mt-5 block font-mono text-xs text-muted">
            Message
            <textarea name="message" required rows={5} maxLength={4000} className={fieldClass} />
          </label>
          <input name="website" tabIndex={-1} autoComplete="off" aria-hidden className="hidden" />

          <button
            type="submit"
            disabled={status === "sending"}
            className="btn-race mt-6 w-full disabled:bg-panel disabled:text-ink"
          >
            {status === "sending" && <span aria-hidden className="pit-stop absolute inset-y-0 left-0 bg-lime/40" />}
            <span className="relative">{status === "sending" ? "Box box box" : "Transmit"}</span>
          </button>
          <p aria-live="polite" className="mt-3 min-h-5 font-mono text-xs text-lime">
            {status === "sent" ? "Radio check complete. Message received." : ""}
          </p>
        </form>
      </div>
    </section>
  );
}
