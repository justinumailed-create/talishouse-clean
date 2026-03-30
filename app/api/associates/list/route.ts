import { getAssociates } from "@/lib/db";

export async function GET() {
  try {
    const data = getAssociates();

    console.log("LIST API DATA:", data);

    return Response.json(data);
  } catch (err) {
    console.error("LIST API ERROR:", err);

    return Response.json([], { status: 200 });
  }
}
