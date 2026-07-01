"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";

interface QueueItem {
  id: string;
  requestId: string;
  status: "queued" | "processing" | "ready_for_review" | "completed" | "failed";
  assignedTo: string | null;
  priority: number;
  fastCode: string | null;
  firstName: string;
  lastName: string;
  email: string;
  type: string;
  mapsiteStatus: string;
  createdAt: string;
}

interface UserRecord {
  id: string;
  name: string;
  email: string;
}

function toErrorLogObject(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...Object.fromEntries(
        Object.getOwnPropertyNames(err).map((key) => [key, (err as Record<string, unknown>)[key]])
      ),
    };
  }

  if (typeof err === "object" && err !== null) {
    const maybe = err as {
      code?: unknown;
      message?: unknown;
      details?: unknown;
      hint?: unknown;
      status?: unknown;
      statusText?: unknown;
      error?: unknown;
      cause?: unknown;
    };

    const extracted: Record<string, unknown> = {
      code: maybe.code ?? null,
      message: maybe.message ?? null,
      details: maybe.details ?? null,
      hint: maybe.hint ?? null,
      status: maybe.status ?? null,
      statusText: maybe.statusText ?? null,
      stringValue: String(err),
    };

    if (maybe.error) extracted.error = toErrorLogObject(maybe.error);
    if (maybe.cause) extracted.cause = toErrorLogObject(maybe.cause);
    return extracted;
  }

  return { message: String(err) };
}

type ColumnId = "new" | "assigned" | "in_progress" | "ready_for_review" | "completed";

const COLUMNS: { id: ColumnId; label: string; description: string }[] = [
  { id: "new", label: "New", description: "Awaiting assignment" },
  { id: "assigned", label: "Assigned", description: "Assigned to team member" },
  { id: "in_progress", label: "In Progress", description: "Currently being built" },
  { id: "ready_for_review", label: "Ready For Review", description: "Awaiting QA approval" },
  { id: "completed", label: "Completed", description: "Shipped to client" },
];

function getColumnId(item: QueueItem): ColumnId {
  if (item.status === "completed") return "completed";
  if (item.status === "ready_for_review") return "ready_for_review";
  if (item.status === "processing") return "in_progress";
  if (item.status === "queued" && item.assignedTo) return "assigned";
  return "new";
}

function mapDropToStatus(columnId: ColumnId): { status: string; keepAssigned: boolean } {
  switch (columnId) {
    case "new":
      return { status: "queued", keepAssigned: false };
    case "assigned":
      return { status: "queued", keepAssigned: true };
    case "in_progress":
      return { status: "processing", keepAssigned: true };
    case "ready_for_review":
      return { status: "ready_for_review", keepAssigned: true };
    case "completed":
      return { status: "completed", keepAssigned: true };
  }
}

function Column({ id, label, description, items, onAssign }: { id: ColumnId; label: string; description: string; items: QueueItem[]; onAssign?: (item: QueueItem) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={`flex-shrink-0 w-72 flex flex-col rounded-xl border transition-all ${
        isOver
          ? "border-blue-400 bg-blue-50/50"
          : "border-neutral-200 bg-neutral-50/50"
      }`}
    >
      <div className="p-4 pb-2 border-b border-neutral-200">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-900">{label}</h3>
          <span className="text-xs font-medium text-neutral-400 bg-neutral-200/60 px-2 py-0.5 rounded-full">
            {items.length}
          </span>
        </div>
        <p className="text-[10px] text-neutral-400 mt-0.5">{description}</p>
      </div>
      <div className="flex-1 p-3 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)]">
        {items.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-neutral-300 border border-dashed border-neutral-200 rounded-lg">
            Drop here
          </div>
        ) : (
          items.map((item) => <DraggableCard key={item.id} item={item} onAssign={onAssign} />)
        )}
      </div>
    </div>
  );
}

function DraggableCard({ item, onAssign }: { item: QueueItem; onAssign?: (item: QueueItem) => void }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: item.id,
    data: item,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        opacity: isDragging ? 0.4 : 1,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="bg-white border border-neutral-200 rounded-xl p-4 shadow-sm cursor-grab active:cursor-grabbing hover:border-neutral-300 hover:shadow-md transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        {item.fastCode ? (
          <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            {item.fastCode}
          </span>
        ) : (
          <span className="text-xs text-neutral-300">—</span>
        )}
        <span className="text-[10px] text-neutral-400">{item.type || "Standard"}</span>
      </div>
      <p className="text-sm font-medium text-neutral-900 truncate">
        {item.firstName} {item.lastName}
      </p>
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-neutral-100">
        <div className="flex items-center gap-1 min-w-0">
          <div className="w-4 h-4 bg-neutral-200 rounded-full flex items-center justify-center text-[8px] font-medium text-neutral-500 flex-shrink-0">
            {item.assignedTo ? "U" : "—"}
          </div>
          <span className="text-[11px] text-neutral-500 truncate">
            {item.assignedTo ? "Assigned" : "Unassigned"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {!item.assignedTo && onAssign && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAssign(item);
              }}
              className="text-[10px] font-medium text-blue-600 hover:text-blue-800 transition-colors"
            >
              Assign
            </button>
          )}
          <span className="text-[10px] text-neutral-400">
            {item.createdAt
              ? new Date(item.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })
              : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

function CardPreview({ item }: { item: QueueItem }) {
  return (
    <div className="bg-white border-2 border-blue-400 rounded-xl p-4 shadow-lg rotate-2 w-72">
      <div className="flex items-center justify-between mb-2">
        {item.fastCode && (
          <span className="font-mono text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
            {item.fastCode}
          </span>
        )}
        <span className="text-[10px] text-neutral-400">{item.type || "Standard"}</span>
      </div>
      <p className="text-sm font-medium text-neutral-900">
        {item.firstName} {item.lastName}
      </p>
    </div>
  );
}

export default function ProductionQueuePage() {
  const [items, setItems] = useState<QueueItem[]>([]);
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchWarning, setFetchWarning] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<QueueItem | null>(null);
  const [assignModal, setAssignModal] = useState<{ item: QueueItem } | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  useEffect(() => {
    fetchQueue();
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data } = await supabase
        .from("users")
        .select("id, name, email")
        .eq("role", "associate")
        .order("name");
      if (data) setUsers(data as UserRecord[]);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  }

  async function fetchQueue() {
    setLoading(true);
    setFetchWarning(null);
    try {
      const { data: pqData, error } = await supabase
        .from("production_queue")
        .select("id, request_id, status, assigned_to, priority, created_at")
        .order("priority", { ascending: false })
        .order("created_at", { ascending: false });

      if (error) throw error;
      if (!pqData || pqData.length === 0) {
        setItems([]);
        return;
      }

      const requestIds = pqData.map((r) => r.request_id);

      const { data: brData } = await supabase
        .from("build_requests")
        .select("id, first_name, last_name, email, created_at")
        .in("id", requestIds);

      const brMap: Record<string, { first_name: string; last_name: string; email: string; created_at: string }> = {};
      if (brData) {
        brData.forEach((br) => {
          brMap[br.id] = br;
        });
      }

      const { data: fcData } = await supabase
        .from("fast_codes")
        .select("code, request_id")
        .in("request_id", requestIds);

      const fcMap: Record<string, string> = {};
      if (fcData) {
        fcData.forEach((fc) => {
          fcMap[fc.request_id] = fc.code;
        });
      }

      const { data: msData } = await supabase
        .from("mapsite_requests")
        .select("request_id, status, type")
        .in("request_id", requestIds);

      const msMap: Record<string, { status: string; type: string }> = {};
      if (msData) {
        msData.forEach((ms) => {
          msMap[ms.request_id] = { status: ms.status, type: ms.type };
        });
      }

      const mapped: QueueItem[] = pqData.map((pq) => {
        const br = brMap[pq.request_id];
        const fc = fcMap[pq.request_id];
        const ms = msMap[pq.request_id];
        return {
          id: pq.id,
          requestId: pq.request_id,
          status: pq.status as QueueItem["status"],
          assignedTo: pq.assigned_to,
          priority: pq.priority,
          fastCode: fc || null,
          firstName: br?.first_name || "Unknown",
          lastName: br?.last_name || "",
          email: br?.email || "",
          type: ms?.type || "",
          mapsiteStatus: ms?.status || "",
          createdAt: br?.created_at || pq.created_at,
        };
      });

      setItems(mapped);
    } catch (err) {
      console.warn("Production queue fetch warning:", toErrorLogObject(err));
      setFetchWarning("Production queue could not be fully loaded right now.");
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  const columns = useMemo(() => {
    const grouped: Record<ColumnId, QueueItem[]> = {
      new: [],
      assigned: [],
      in_progress: [],
      ready_for_review: [],
      completed: [],
    };
    items.forEach((item) => {
      grouped[getColumnId(item)].push(item);
    });
    return COLUMNS.map((col) => ({
      ...col,
      items: grouped[col.id],
    }));
  }, [items]);

  function handleDragStart(event: DragStartEvent) {
    const dragged = items.find((i) => i.id === event.active.id);
    if (dragged) setActiveItem(dragged);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveItem(null);
    const { active, over } = event;
    if (!over) return;

    const item = items.find((i) => i.id === active.id);
    if (!item) return;

    const targetColumnId = over.id as ColumnId;
    const currentColumnId = getColumnId(item);
    if (targetColumnId === currentColumnId) return;

    const { status, keepAssigned } = mapDropToStatus(targetColumnId);

    if (targetColumnId === "assigned" && !item.assignedTo) {
      setAssignModal({ item });
      return;
    }

    const updatedAssignedTo = keepAssigned ? item.assignedTo : null;

    try {
      const { error: pqError } = await supabase
        .from("production_queue")
        .update({
          status,
          assigned_to: updatedAssignedTo,
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (pqError) throw pqError;

      const mapsiteStatus = targetColumnId === "completed" ? "completed"
        : targetColumnId === "ready_for_review" ? "ready_for_review"
        : targetColumnId === "in_progress" ? "processing"
        : "pending";

      const msUpdate: Record<string, string> = { status: mapsiteStatus };
      if (targetColumnId === "completed") {
        msUpdate.completed_at = new Date().toISOString();
      }

      await supabase
        .from("mapsite_requests")
        .update(msUpdate)
        .eq("request_id", item.requestId);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id
            ? { ...i, status: status as QueueItem["status"], assignedTo: updatedAssignedTo }
            : i
        )
      );
    } catch (err) {
      console.error("Error updating queue item:", err);
    }
  }

  async function handleAssign(item: QueueItem, userId: string) {
    try {
      const { error: pqError } = await supabase
        .from("production_queue")
        .update({
          assigned_to: userId,
          status: "queued",
          updated_at: new Date().toISOString(),
        })
        .eq("id", item.id);

      if (pqError) throw pqError;

      await supabase
        .from("mapsite_requests")
        .update({ assigned_to: userId, status: "pending" })
        .eq("request_id", item.requestId);

      setItems((prev) =>
        prev.map((i) =>
          i.id === item.id ? { ...i, assignedTo: userId } : i
        )
      );
      setAssignModal(null);
    } catch (err) {
      console.error("Error assigning:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Production Queue</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drag cards between columns to update status
          </p>
        </div>
        <button
          onClick={fetchQueue}
          className="px-4 py-2 text-sm bg-white border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Refresh
        </button>
      </div>

      {fetchWarning && (
        <div className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {fetchWarning}
        </div>
      )}

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto pb-4">
          {columns.map((col) => (
            <Column
              key={col.id}
              id={col.id}
              label={col.label}
              description={col.description}
              items={col.items}
              onAssign={(item) => setAssignModal({ item })}
            />
          ))}
        </div>

        <DragOverlay>
          {activeItem ? <CardPreview item={activeItem} /> : null}
        </DragOverlay>
      </DndContext>

      {assignModal && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-sm mx-4">
            <h3 className="text-lg font-semibold mb-1">Assign Request</h3>
            <p className="text-sm text-neutral-500 mb-4">
              {assignModal.item.firstName} {assignModal.item.lastName}
              {assignModal.item.fastCode ? ` — ${assignModal.item.fastCode}` : ""}
            </p>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {users.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-4">
                  No associates found
                </p>
              ) : (
                users.map((user) => (
                  <button
                    key={user.id}
                    onClick={() => handleAssign(assignModal.item, user.id)}
                    className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-neutral-100 transition-colors"
                  >
                    <p className="text-sm font-medium text-neutral-900">{user.name}</p>
                    <p className="text-xs text-neutral-400">{user.email}</p>
                  </button>
                ))
              )}
            </div>
            <button
              onClick={() => setAssignModal(null)}
              className="w-full mt-4 h-10 text-sm text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
