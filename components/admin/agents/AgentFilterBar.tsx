import { cardClass, fieldClass, primaryButton } from "./ui";

/** GET filter form (agent, optional action, date range) shared by the superadmin agent pages. */
export default function AgentFilterBar({
  action,
  agents,
  values,
  actionOptions,
}: {
  action: string;
  agents: Array<{ id: string; name: string; loginId: string }>;
  values: { agent?: string; type?: string; from?: string; to?: string };
  actionOptions?: Array<{ value: string; label: string }>;
}) {
  const label = "mb-1.5 block text-xs font-medium text-neutral-700";
  return (
    <form method="get" action={action} className={`${cardClass} grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_160px_160px_auto] lg:items-end`}>
      <div>
        <label className={label} htmlFor="f-agent">Agent</label>
        <select id="f-agent" name="agent" defaultValue={values.agent ?? ""} className={fieldClass}>
          <option value="">All agents</option>
          {agents.map((a) => <option key={a.id} value={a.id}>{a.name} ({a.loginId})</option>)}
        </select>
      </div>
      {actionOptions ? (
        <div>
          <label className={label} htmlFor="f-type">Action</label>
          <select id="f-type" name="type" defaultValue={values.type ?? ""} className={fieldClass}>
            <option value="">All actions</option>
            {actionOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      ) : <div className="hidden lg:block" />}
      <div>
        <label className={label} htmlFor="f-from">From (IST)</label>
        <input id="f-from" type="date" name="from" defaultValue={values.from ?? ""} className={fieldClass} />
      </div>
      <div>
        <label className={label} htmlFor="f-to">To (IST)</label>
        <input id="f-to" type="date" name="to" defaultValue={values.to ?? ""} className={fieldClass} />
      </div>
      <button type="submit" className={primaryButton}>Apply</button>
    </form>
  );
}
