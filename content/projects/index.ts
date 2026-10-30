import type { Project } from "../types";
import { athletix } from "./athletix";
import { case43 } from "./case43";
import { fleetCreditTracker } from "./fleet-credit-tracker";
import { satquery } from "./satquery";
import { sharpening } from "./sharpening";
import { tda } from "./tda";
import { tether } from "./tether";
import { timeweave } from "./timeweave";

export const projects: Project[] = [
  fleetCreditTracker,
  satquery,
  timeweave,
  tda,
  tether,
  case43,
  athletix,
  sharpening,
].sort((a, b) => a.position - b.position);

export function getProject(slug: string) {
  return projects.find((project) => project.slug === slug);
}
