/** Homepage left column mounts the TalisBOT launcher into this slot. */
export const HOME_TALISBOT_SLOT_ID = "home-talisbot-slot";

/**
 * Homepage left column: TalisBOT launcher slot only. Markets live in the
 * navbar / market-page dropdown — nothing is stacked under the bot.
 */
export default function TalisprosHomeCornerLinks() {
  return (
    <div
      className="flex shrink-0 flex-col items-start pb-3 pl-6 pr-4 pt-1 font-sans"
      data-testid="home-corner-links"
    >
      <div
        id={HOME_TALISBOT_SLOT_ID}
        data-testid="home-talisbot-slot"
        className="h-[70px] w-[70px] shrink-0"
      />
    </div>
  );
}
