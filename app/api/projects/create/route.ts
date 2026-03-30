export async function POST(req: Request) {
  try {
    const body = await req.json();

    return Response.json({
      success: true,
      projectCode: `${body.fastCode}-TEST01`
    });
  } catch (err) {
    return Response.json(
      { error: "Failed to create project" },
      { status: 500 }
    );
  }
}
