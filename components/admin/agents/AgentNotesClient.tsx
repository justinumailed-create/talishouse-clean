"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  confirmNoteUploadAction,
  createNoteAction,
  startNoteUploadAction,
  updateNoteAction,
} from "@/app/admin/agent/notes/actions";
import { AGENT_NOTE_MAX_CHARS, AGENT_NOTES_BUCKET, formatBytes, formatIstTime, validateNoteFile } from "@/lib/agent-collab";
import { supabase } from "@/lib/supabase";
import { cardClass, primaryButton, secondaryButton, textareaClass } from "./ui";

type Note = { id: string; body: string; createdAt: string; updatedAt: string };
type NoteFile = { id: string; fileName: string; sizeBytes: number; createdAt: string; url: string | null };
type Status = { kind: "ok" | "error"; text: string } | null;

function StatusLine({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <p role="status" className={`rounded-lg px-3 py-2 text-sm ${status.kind === "ok" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-700"}`}>
      {status.text}
    </p>
  );
}

function NoteItem({ note, editable }: { note: Note; editable: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [body, setBody] = useState(note.body);
  const [status, setStatus] = useState<Status>(null);
  const [pending, start] = useTransition();
  const edited = note.updatedAt !== note.createdAt && new Date(note.updatedAt).getTime() - new Date(note.createdAt).getTime() > 1000;

  return (
    <li className="px-5 py-4">
      <div className="flex items-center justify-between gap-2 text-xs text-neutral-500">
        <span>
          {formatIstTime(note.createdAt)} IST{edited ? ` · edited ${formatIstTime(note.updatedAt)}` : ""}
        </span>
        {editable && !editing ? (
          <button type="button" className="font-semibold text-[#1E4ED8] hover:underline" onClick={() => setEditing(true)}>
            Edit
          </button>
        ) : null}
      </div>
      {editing ? (
        <div className="mt-2 space-y-2">
          <textarea className={textareaClass} rows={4} maxLength={AGENT_NOTE_MAX_CHARS} value={body} onChange={(e) => setBody(e.target.value)} />
          <div className="flex gap-2">
            <button
              type="button"
              className={primaryButton}
              disabled={pending || !body.trim()}
              onClick={() =>
                start(async () => {
                  try {
                    const r = await updateNoteAction(note.id, body);
                    if (!r.ok) return setStatus({ kind: "error", text: r.error });
                    setEditing(false);
                    setStatus(null);
                    router.refresh();
                  } catch {
                    setStatus({ kind: "error", text: "Network error. Please try again." });
                  }
                })
              }
            >
              Save
            </button>
            <button type="button" className={secondaryButton} onClick={() => { setEditing(false); setBody(note.body); }}>
              Cancel
            </button>
          </div>
          <StatusLine status={status} />
        </div>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-neutral-900">{note.body}</p>
      )}
    </li>
  );
}

export default function AgentNotesClient({ editable, notes, files }: { editable: boolean; notes: Note[]; files: NoteFile[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState("");
  const [noteStatus, setNoteStatus] = useState<Status>(null);
  const [fileStatus, setFileStatus] = useState<Status>(null);
  const [uploading, setUploading] = useState(false);
  const [pending, start] = useTransition();
  const fileInput = useRef<HTMLInputElement>(null);

  async function upload(file: File) {
    const check = validateNoteFile({ name: file.name, size: file.size, type: file.type });
    if (!check.ok) return setFileStatus({ kind: "error", text: check.error });
    setUploading(true);
    setFileStatus(null);
    try {
      const started = await startNoteUploadAction({ name: file.name, size: file.size, type: file.type });
      if (!started.ok || !started.value) throw new Error(started.ok ? "Could not start the upload." : started.error);
      const { path, token, mimeType } = started.value;
      const { error } = await supabase.storage
        .from(AGENT_NOTES_BUCKET)
        .uploadToSignedUrl(path, token, file, { contentType: mimeType });
      if (error) throw new Error(error.message || "Upload failed.");
      const confirmed = await confirmNoteUploadAction(path);
      if (!confirmed.ok) throw new Error(confirmed.error);
      setFileStatus({ kind: "ok", text: `Uploaded ${check.fileName}.` });
      router.refresh();
    } catch (err) {
      setFileStatus({ kind: "error", text: err instanceof Error ? err.message : "Upload failed." });
    } finally {
      setUploading(false);
      if (fileInput.current) fileInput.current.value = "";
    }
  }

  return (
    <div className="space-y-6">
      {editable ? (
        <form
          className={`${cardClass} space-y-3 p-5`}
          onSubmit={(e) => {
            e.preventDefault();
            if (!draft.trim()) return;
            setNoteStatus(null);
            start(async () => {
              try {
                const r = await createNoteAction(draft);
                if (!r.ok) return setNoteStatus({ kind: "error", text: r.error });
                setDraft("");
                router.refresh();
              } catch {
                setNoteStatus({ kind: "error", text: "Network error. Please try again." });
              }
            });
          }}
        >
          <label htmlFor="new-note" className="text-sm font-semibold text-neutral-900">Add a note</label>
          <textarea
            id="new-note"
            className={textareaClass}
            rows={4}
            maxLength={AGENT_NOTE_MAX_CHARS}
            placeholder="What did you work on? Calls, Mapsites updated, follow-ups…"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-neutral-400">{draft.length}/{AGENT_NOTE_MAX_CHARS}</span>
            <button type="submit" className={primaryButton} disabled={pending || !draft.trim()}>
              {pending ? "Saving…" : "Save note"}
            </button>
          </div>
          <StatusLine status={noteStatus} />
        </form>
      ) : null}

      <section className={cardClass}>
        <h2 className="border-b border-neutral-200 px-5 py-3 text-[15px] font-semibold text-neutral-900">Notes</h2>
        {notes.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">No notes for this day.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {notes.map((n) => <NoteItem key={n.id} note={n} editable={editable} />)}
          </ul>
        )}
      </section>

      <section className={cardClass}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-neutral-200 px-5 py-3">
          <h2 className="text-[15px] font-semibold text-neutral-900">Documents</h2>
          {editable ? (
            <>
              <input
                ref={fileInput}
                type="file"
                className="sr-only"
                id="note-file"
                accept=".pdf,.jpg,.jpeg,.png,.webp,.txt,.csv,.doc,.docx,.xls,.xlsx"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) void upload(f); }}
              />
              <label htmlFor="note-file" className={`${secondaryButton} h-9 cursor-pointer ${uploading ? "pointer-events-none opacity-50" : ""}`}>
                {uploading ? "Uploading…" : "Upload document"}
              </label>
            </>
          ) : null}
        </div>
        {editable ? <p className="px-5 pt-3 text-xs text-neutral-500">PDF, images, Word, Excel, TXT or CSV · up to 10 MB each. Files are private.</p> : null}
        <div className="px-5 pt-3"><StatusLine status={fileStatus} /></div>
        {files.length === 0 ? (
          <p className="px-5 py-6 text-sm text-neutral-500">No documents for this day.</p>
        ) : (
          <ul className="divide-y divide-neutral-200">
            {files.map((f) => (
              <li key={f.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <span className="min-w-0">
                  <span className="block truncate font-medium text-neutral-900">{f.fileName}</span>
                  <span className="text-xs text-neutral-500">{formatBytes(f.sizeBytes)} · {formatIstTime(f.createdAt)} IST</span>
                </span>
                {f.url ? (
                  <a href={f.url} target="_blank" rel="noopener noreferrer" className="shrink-0 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-800 hover:bg-neutral-50">
                    Open
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
