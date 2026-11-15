import AishaConvaiWidget from "@/components/talispros/AishaConvaiWidget";
import {
  AISHA_MAPSITE_AGENT_ID,
  aishaMapsiteDynamicVariables,
  type AishaMapsiteDynamicInput,
} from "@/lib/talispros/aisha-mapsite-agent";
import { mapsiteAishaInvitation } from "@/lib/talispros/aisha-mapsites";

/** The Mapsite Aisha. The public homepage keeps its own agent. */
export default function MapsiteAisha(input: AishaMapsiteDynamicInput) {
  return (
    <AishaConvaiWidget
      invitation={mapsiteAishaInvitation()}
      placement="bottom-right"
      agentId={AISHA_MAPSITE_AGENT_ID}
      dynamicVariables={aishaMapsiteDynamicVariables(input)}
    />
  );
}
