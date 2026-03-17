import { auth } from "auth";
import { redirect } from "next/navigation";
import { EditorLayout } from "@/components/editor/EditorLayout";

export default async function EditorPage() {
  const session = await auth();
  if (!session) redirect("/");

  return (
    <div className="min-h-screen bg-background">
      <EditorLayout />
    </div>
  );
}
