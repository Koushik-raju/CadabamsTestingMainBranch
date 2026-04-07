"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { v4 as uuidv4 } from "uuid";

export default function NewChatRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace(`/chat/${uuidv4()}`);
  }, [router]);

  return null;
}
