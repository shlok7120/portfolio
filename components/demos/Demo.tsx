import type { Project } from "@/content/types";
import { FleetDemo } from "./FleetDemo";
import { RecoveryDemo } from "./RecoveryDemo";
import { SatQueryDemo } from "./SatQueryDemo";
import { TimeWeaveDemo } from "./TimeWeaveDemo";

const demos = {
  fleet: FleetDemo,
  satquery: SatQueryDemo,
  timeweave: TimeWeaveDemo,
  recovery: RecoveryDemo,
};

export function Demo({ name }: { name: NonNullable<Project["demo"]> }) {
  const Chosen = demos[name];
  return <Chosen />;
}
