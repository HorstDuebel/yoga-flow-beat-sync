import { auth } from "auth";
import { redirect, notFound } from "next/navigation";
import { FlowPlayer } from "@/components/flow/FlowPlayer";
import { getFlowById } from "@/lib/flows";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function FlowPage({ params }: Props) {
  const session = await auth();
  if (!session) redirect("/");

  const { id } = await params;
  const flow = await getFlowById(id);
  if (!flow) notFound();

  return (
    <div className="min-h-screen bg-background">
      <FlowPlayer flow={flow} />
    </div>
  );
}
