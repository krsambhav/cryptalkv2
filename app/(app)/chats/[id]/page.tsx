import { ChatView } from "@/components/chat/ChatView";

export default async function ConvoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ChatView convoId={id} />;
}
