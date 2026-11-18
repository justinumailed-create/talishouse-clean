import AishaConvaiWidget from "@/components/talispros/AishaConvaiWidget";
import {
  AISHA_MAPSITE_AGENT_ID,
  aishaMapsiteDynamicVariables,
  type AishaMapsiteDynamicInput,
} from "@/lib/talispros/aisha-mapsite-agent";
import { mapsiteAishaInvitation } from "@/lib/talispros/aisha-mapsites";
import { mapsiteAishaVariables } from "@/lib/talispros/aisha-owner-session";

/** The Mapsite Aisha. The public homepage keeps its own agent. */
export default async function MapsiteAisha(input: AishaMapsiteDynamicInput) {
  const agentId: string = AISHA_MAPSITE_AGENT_ID;
  const dynamicVariables = await mapsiteAishaVariables(
    agentId,
    aishaMapsiteDynamicVariables(input),
  );
  return (
    <AishaConvaiWidget
      invitation={mapsiteAishaInvitation()}
      placement="bottom-right"
      agentId={agentId}
      dynamicVariables={dynamicVariables}
    />
  );
}
