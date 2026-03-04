import React from "react";
import SupportChatWidget from "./ChatIcon";

export default function EmbedWidgetPage() {
  const key = new URLSearchParams(window.location.search).get("key") || "";
  return <SupportChatWidget tenantKey={key} />;
}