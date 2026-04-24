import { redirect } from "next/navigation";

export default function NewChatRedirect() {
  redirect(`/chat/thread/${crypto.randomUUID()}`);
}
