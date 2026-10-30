import { EasterEgg } from "@/components/hud/EasterEgg";
import { Hud } from "@/components/hud/Hud";
import { LightsOut } from "@/components/hud/LightsOut";
import { Driver } from "@/components/sections/Driver";
import { Finish } from "@/components/sections/Finish";
import { Grid } from "@/components/sections/Grid";
import { PitLane } from "@/components/sections/PitLane";
import { Results } from "@/components/sections/Results";
import { Season } from "@/components/sections/Season";
import { Setup } from "@/components/sections/Setup";
import { SpeedTrap } from "@/components/sections/SpeedTrap";
import { LapExperience } from "@/components/three/LapExperience";
import { SectorGate } from "@/components/ui/SectorGate";
import { TimingTower } from "@/components/ui/TimingTower";

export default function Home() {
  return (
    <>
      <noscript>
        <style>{".lights-overlay{display:none}.rise{transform:none!important}"}</style>
      </noscript>
      <LightsOut />
      <LapExperience />
      <Hud />
      <EasterEgg />
      <main className="relative z-10">
        <Grid />
        <SectorGate sector="Sector 1" label="Into the first corner">
          <TimingTower />
        </SectorGate>
        <Driver />
        <SectorGate sector="Sector 2" label="Long-run pace" />
        <Results />
        <SpeedTrap />
        <SectorGate sector="Sector 3" label="Final push" />
        <Setup />
        <Season />
        <SectorGate sector="Last corner" label="Box this lap" />
        <PitLane />
        <Finish />
      </main>
    </>
  );
}
