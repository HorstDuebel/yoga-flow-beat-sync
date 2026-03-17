import { NextResponse } from "next/server";
import { getFlowById } from "@/lib/flows";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const flow = await getFlowById(id);
  if (!flow) {
    return NextResponse.json({ error: "Flow nicht gefunden" }, { status: 404 });
  }
  return NextResponse.json(flow);
}
