import { getAssociates, saveAssociates } from "@/lib/db";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (!body.id) {
      return Response.json({ error: "Associate ID required" }, { status: 400 });
    }

    const associates = getAssociates();
    const index = associates.findIndex((a: any) => a.id === body.id);

    if (index === -1) {
      return Response.json({ error: "Associate not found" }, { status: 404 });
    }

    // Update associate with new data
    const updated = {
      ...associates[index],
      ...body.updates,
      updatedAt: new Date().toISOString()
    };

    associates[index] = updated;
    saveAssociates(associates);

    console.log("UPDATED ASSOCIATE:", updated);

    return Response.json({ success: true, associate: updated });

  } catch (err) {
    console.error("UPDATE API ERROR:", err);
    return Response.json({ error: "Update failed" }, { status: 500 });
  }
}
