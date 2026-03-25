import {
  Bot,
  MessageSquareIcon,
  Minus,
  User,
  X,
  MessageCircle,
  MessageSquare,
  MessageSquareDot,
  Send,
  MessageCircleHeart
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";

/* --------------------------------
   Theme definitions (fallback defaults)
-------------------------------- */
const THEMES = {
  1: {
    name: "Theme 1 (Fallback)",
    vars: {
      panelBg: "#ffffff",
      headerBg: "#6B69B2",
      bodyBg: "#ffffff",
      text: "#0F172A",
      textMuted: "rgba(15,23,42,0.55)",
      primary: "#6B69B2",
      primarySoft: "rgba(109,102,216,0.12)",
      accent: "#22C55E",
      searchbar: "#F3F4F6",
      searchbarBorder: "#99A1AF",
      searchbarText: "#0F172A",
      border: "rgba(15,23,42,0.12)",
      ring: "rgba(109,102,216,0.3)",
      shadow: "0 18px 45px rgba(15,23,42,0.18)",
      aiBubbleBg: "#FBF8FF",
      aiBubbleText: "#0F172A",
      userBubbleBg: "#59AEB8",
      userBubbleText: "#ffffff",
      inputBg: "#ffffff",
      inputText: "#0F172A",
      inputPlaceholder: "rgba(15,23,42,0.45)",
      optionBg: "rgba(109,102,216,0.1)",
      optionText: "#2A2A70",
      optionHoverBg: "rgba(109,102,216,0.18)",
      fabBg: "#6B69B2",
      fabRing: "rgba(109,102,216,0.35)",
      radius: "18px",
      fontFamily: "Inter, system-ui, sans-serif",
      fontSize: "14px",
    },
  },
};

const externalIconsMap = {
  4: MessageCircle,
  5: MessageSquare,
  6: MessageSquareDot,
  7: Send,
  8: MessageCircleHeart,
};
const uid = () => Math.random().toString(16).slice(2);
const timeNow = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const THEME_API_BASE =
  "https://equitably-skimpy-ryan.ngrok-free.dev/api/widgets/embed";

function pickFirst(...vals) {
  for (const v of vals) {
    if (v !== null && v !== undefined && v !== "") return v;
  }
  return undefined;
}

function normalizeMediaUrl(url) {
  if (!url) return "";
  if (window.location.protocol === "https:") {
    return url.replace(/^http:\/\//i, "https://");
  }
  return url;
}

/** Position helpers */
function getPositionStyles(position = "bottom_right") {
  const btn = { bottom: 24, right: 24 };
  const modal = { bottom: 96, right: 24 };

  switch (position) {
    case "bottom_left":
      btn.bottom = 24;
      btn.left = 24;
      delete btn.right;
      modal.bottom = 96;
      modal.left = 24;
      delete modal.right;
      break;
    case "top_right":
      btn.top = 24;
      btn.right = 24;
      delete btn.bottom;
      modal.top = 96;
      modal.right = 24;
      delete modal.bottom;
      break;
    case "top_left":
      btn.top = 24;
      btn.left = 24;
      delete btn.bottom;
      delete btn.right;
      modal.top = 96;
      modal.left = 24;
      delete modal.bottom;
      delete modal.right;
      break;
    case "bottom_right":
    default:
      break;
  }

  return { btn, modal };
}

export default function SupportChatWidget({ tenantKey = "" }) {
  const [themeId] = useState(1);
  const [remoteTheme, setRemoteTheme] = useState(null);
  const [themeLoading, setThemeLoading] = useState(true);
  const [widgetCfg, setWidgetCfg] = useState(null);
  const [chatIconUrl, setChatIconUrl] = useState("");

  const [isExternalIcon, setIsExternalIcon] = useState(false);
  const [externalIconId, setExternalIconId] = useState(null);

  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loadingIntro, setLoadingIntro] = useState(false);

  // Socket states
  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptRef = useRef(0);
  const shouldReconnectRef = useRef(false);
  const typingTimerRef = useRef(null);
  const hasReceivedFirstMessageRef = useRef(false);
  const introTimerRef = useRef(null);
  const hasShownWelcomeRef = useRef(false);

  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);

  const [dimensions, setDimensions] = useState({ width: 360, height: 360 });
  const isResizing = useRef(null);
  const lastMouseRef = useRef({ x: 0, y: 0 });
  const minSize = { w: 320, h: 320 };
  const maxSize = { w: 720, h: 820 };

  const modalRef = useRef(null);
  const widgetRef = useRef(null);
  const listRef = useRef(null);
  const timers = useRef([]);

  // ✅ Storage keys for persistence
  const STORAGE_KEYS = {
    messages: `cw_messages_${tenantKey}`,
    visitorId: `cw_vid_${tenantKey}`,
  };

  // ✅ Load messages from localStorage on mount
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(STORAGE_KEYS.messages);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed);
        if (parsed.length > 0) {
          hasShownWelcomeRef.current = true;
        }
      }
    } catch (err) {
      console.error("[Widget] Failed to load messages from storage:", err);
    }
  }, [tenantKey]);

  // ✅ Save messages to localStorage whenever they change
  useEffect(() => {
    if (messages.length > 0) {
      try {
        localStorage.setItem(STORAGE_KEYS.messages, JSON.stringify(messages));
      } catch (err) {
        console.error("[Widget] Failed to save messages to storage:", err);
      }
    }
  }, [messages]);

  // ------- Fetch Theme + Widget Config -------
  useEffect(() => {
    if (!tenantKey) return;

    let cancelled = false;
    setThemeLoading(true);

    (async () => {
      try {
        const url = `${THEME_API_BASE}/${encodeURIComponent(tenantKey)}/theme/`;
        const res = await fetch(url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        const json = await res.json();

        if (!json?.success) {
          throw new Error(json?.message || "Theme API returned success=false");
        }

        const widget = json?.data?.widget || {};
        const theme = json?.data?.theme || {};

        if (!cancelled) {
          setWidgetCfg(widget);
          setRemoteTheme(theme);

          setChatIconUrl(normalizeMediaUrl(json?.data?.chat_icon_url || ""));
          setIsExternalIcon(json?.data?.is_external_icon || false);
          setExternalIconId(json?.data?.external_icon_id || null);
        }
      } catch (err) {
        console.error("[Widget] Theme fetch failed:", err);
        if (!cancelled) {
          setWidgetCfg(null);
          setRemoteTheme(null);
          setChatIconUrl("");
        }
      } finally {
        if (!cancelled) {
          setThemeLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [tenantKey]);

  const isEnabled = widgetCfg?.enabled ?? true;
  const position = widgetCfg?.position || "bottom_right";
  const { btn: btnPos, modal: modalPos } = useMemo(
    () => getPositionStyles(position),
    [position]
  );

  const welcomeMessage =
    widgetCfg?.welcome_message || "Hi 👋 How can I help you today?";
  const inputPlaceholder =
    widgetCfg?.input_placeholder || "Type your message...";

  // ------- Theme -> CSS Vars -------
  const cssVars = useMemo(() => {
    const fallback = THEMES[themeId]?.vars || THEMES[1].vars;
    const t = remoteTheme || {};

    const primary = pickFirst(t.primary_color, fallback.primary);
    const secondary = pickFirst(t.secondary_color, fallback.aiBubbleBg);
    const bg = pickFirst(t.background_color, fallback.panelBg);
    const text = pickFirst(t.text_color, t.font_color, fallback.text);
    const fontFamily = pickFirst(t.font_family, fallback.fontFamily);
    const fontSize = pickFirst(
      typeof t.font_size === "number" ? `${t.font_size}px` : undefined,
      fallback.fontSize
    );

    const radius = pickFirst(
      typeof widgetCfg?.border_radius === "number"
        ? `${widgetCfg.border_radius}px`
        : undefined,
      fallback.radius
    );

    const mergedVars = {
      ...fallback,
      primary,
      headerBg: primary,
      fabBg: primary,
      panelBg: bg,
      bodyBg: bg,
      inputBg: bg,
      text,
      aiBubbleText: text,
      searchbarText: text,
      aiBubbleBg: secondary,
      searchbar: secondary,
      userBubbleBg: primary,
      userBubbleText: secondary,
      fontFamily,
      fontSize,
      radius,
    };

    return Object.fromEntries(
      Object.entries(mergedVars).map(([k, val]) => [`--${k}`, val])
    );
  }, [remoteTheme, widgetCfg, themeId]);

  // ------- Scroll -------
  useEffect(() => {
    if (listRef.current) {
      const isInitial = messages.length <= 1;
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: isInitial ? "auto" : "smooth",
      });
    }
  }, [messages, loadingIntro, isTyping]);

  // ------- Helpers: typing indicator -------
  const showTyping = (show) => {
    setIsTyping(show);
    if (typingTimerRef.current) clearTimeout(typingTimerRef.current);
    if (show) {
      typingTimerRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 6000);
    }
  };

  // ------- Listen for parent messages (CW_OPEN) -------
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === "CW_OPEN") {
        openModal();
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // ------- Visitor ID persistence -------
  const getStoredVisitorId = () => {
    try {
      return localStorage.getItem(STORAGE_KEYS.visitorId) || "new";
    } catch {
      return "new";
    }
  };

  const storeVisitorId = (vid) => {
    if (!vid) return;
    try {
      localStorage.setItem(STORAGE_KEYS.visitorId, vid);
    } catch {
      // ignore
    }
  };

  // ------- WebSocket connect / disconnect -------
  const disconnectWS = () => {
    shouldReconnectRef.current = false;

    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    showTyping(false);
    setIsConnected(false);

    const ws = wsRef.current;
    wsRef.current = null;

    if (ws) {
      try {
        ws.onopen = null;
        ws.onmessage = null;
        ws.onclose = null;
        ws.onerror = null;
        ws.close(1000, "Widget closed");
      } catch {
        // ignore
      }
    }
  };

  const scheduleReconnect = () => {
    if (!shouldReconnectRef.current) return;
    if (reconnectTimerRef.current) return;

    const attempt = reconnectAttemptRef.current;
    const delay = Math.min(30000, 1000 * Math.pow(2, attempt));
    reconnectAttemptRef.current = attempt + 1;

    reconnectTimerRef.current = setTimeout(() => {
      reconnectTimerRef.current = null;
      connectWS();
    }, delay);
  };

  const connectWS = () => {
    if (!tenantKey) return;

    const existing = wsRef.current;
    if (existing && (existing.readyState === 0 || existing.readyState === 1)) {
      return;
    }

    const visitorId = getStoredVisitorId();
    const url = `wss://equitably-skimpy-ryan.ngrok-free.dev/ws/chat/${encodeURIComponent(
      tenantKey
    )}/${encodeURIComponent(visitorId)}/`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        reconnectAttemptRef.current = 0;
      };

      ws.onmessage = (event) => {
        let data = null;
        try {
          data = JSON.parse(event.data);
        } catch (e) {
          console.warn("[Widget] WS non-json message:", event.data);
          return;
        }

        if (!hasReceivedFirstMessageRef.current) {
          hasReceivedFirstMessageRef.current = true;
          setLoadingIntro(false);

          if (introTimerRef.current) {
            clearTimeout(introTimerRef.current);
            introTimerRef.current = null;
          }
        }

        if (data.type === "connection_established") {
          if (data.visitor_id) storeVisitorId(data.visitor_id);
          return;
        }

        if (data.type === "typing" && data.sender === "ai") {
          showTyping(true);
          return;
        }

        if (data.type === "chat_message") {
          const sender = data.sender_type;
          if (sender === "visitor") return;

          showTyping(false);

          setMessages((prev) => [
            ...prev,
            {
              id: data.message_id ? String(data.message_id) : uid(),
              sender: sender === "ai" ? "ai" : "agent",
              text: data.content || "",
              time: timeNow(),
            },
          ]);

          return;
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        showTyping(false);
        wsRef.current = null;
        scheduleReconnect();
      };

      ws.onerror = () => {
        try {
          ws.close();
        } catch {
          // ignore
        }
      };
    } catch (err) {
      console.error("[Widget] WS connect failed:", err);
      scheduleReconnect();
    }
  };

  // ✅ Connect WebSocket when component mounts (persistent connection)
  useEffect(() => {
    shouldReconnectRef.current = true;
    connectWS();

    return () => {
      disconnectWS();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantKey]);

  // ✅ Boot behavior - ALWAYS show loading and welcome message on first open
  useEffect(() => {
    if (!open) return;

    if (messages.length > 0 && hasShownWelcomeRef.current) {
      setLoadingIntro(false);
      return;
    }

    setLoadingIntro(true);
    hasReceivedFirstMessageRef.current = false;

    introTimerRef.current = setTimeout(() => {
      setLoadingIntro(false);

      setMessages((prev) => {
        if (prev.length > 0) return prev;
        hasShownWelcomeRef.current = true;
        return [
          ...prev,
          { id: uid(), sender: "ai", text: welcomeMessage, time: timeNow() },
        ];
      });
    }, 900);

    return () => {
      if (introTimerRef.current) clearTimeout(introTimerRef.current);
      introTimerRef.current = null;
    };
  }, [open, welcomeMessage]);

  // ✅ MINIMIZE - Close modal but keep chat & websocket
  const minimizeChat = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setOpen(false);
    notifyParent("CW_MODAL_CLOSE");
  };

  // ✅ CLOSE - Clear everything and disconnect
  const closeChat = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    setOpen(false);

    setMessages([]);

    try {
      localStorage.removeItem(STORAGE_KEYS.messages);
    } catch (err) {
      console.error("[Widget] Failed to clear messages from storage:", err);
    }

    setInput("");
    setLoadingIntro(false);

    hasShownWelcomeRef.current = false;

    disconnectWS();

    notifyParent("CW_MODAL_CLOSE");
  };

  // ✅ OPEN MODAL function
  const openModal = () => {
    setOpen(true);
    notifyParent("CW_MODAL_OPEN");

    // Reconnect WebSocket if needed
    if (!wsRef.current || wsRef.current.readyState > 1) {
      shouldReconnectRef.current = true; // allow reconnects
      connectWS();
    }
  };

  const sendMessage = (text) => {
    const content = (text || "").trim();
    if (!content) return;

    setMessages((m) => [
      ...m,
      { id: uid(), sender: "user", text: content, time: timeNow() },
    ]);
    setInput("");

    const ws = wsRef.current;
    if (!ws || ws.readyState !== 1) {
      setMessages((m) => [
        ...m,
        {
          id: uid(),
          sender: "ai",
          text: "Not connected yet. Please try again in a moment.",
          time: timeNow(),
        },
      ]);
      return;
    }

    ws.send(
      JSON.stringify({
        type: "chat_message",
        content,
        sender_type: "visitor",
      })
    );
  };

  // ✅ Outside click to minimize modal
  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (e) => {
      // Check if click is outside both the modal AND the FAB button
      if (
        modalRef.current &&
        !modalRef.current.contains(e.target) &&
        widgetRef.current &&
        !widgetRef.current.contains(e.target)
      ) {
        minimizeChat();
      }
    };

    // Add a small delay before attaching the listener
    // This prevents the modal from immediately closing when opened
    const timeoutId = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  // ------- Resize handling -------
  useEffect(() => {
    const onMove = (e) => {
      const dir = isResizing.current;
      if (!dir) return;
      if (window.innerWidth < 1024) return;

      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;

      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      setDimensions((prev) => {
        let width = prev.width;
        let height = prev.height;

        const onRight = position.includes("right");
        const onBottom = position.includes("bottom");

        if (dir.includes("x")) {
          width = onRight ? width - dx : width + dx;
        }

        if (dir.includes("y")) {
          height = onBottom ? height - dy : height + dy;
        }

        width = Math.max(minSize.w, Math.min(maxSize.w, width));
        height = Math.max(minSize.h, Math.min(maxSize.h, height));

        return { width, height };
      });
    };

    const onUp = () => {
      isResizing.current = null;
      document.body.style.cursor = "default";
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [position]);

  // Notify parent about FAB zone
  useEffect(() => {
    notifyParent("CW_FAB_ZONE", {
      position: position,
      size: { width: 80, height: 80 },
    });
  }, [position]);

  // Listen for FAB clicks from parent
  useEffect(() => {
    const onMsg = (e) => {
      if (e.data?.type === "CW_FAB_CLICK") {
        openModal();
      }
    };
    window.addEventListener("message", onMsg);
    return () => window.removeEventListener("message", onMsg);
  }, []);

  // Update notifyParent to accept data
  const notifyParent = (type, data = {}) => {
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type, ...data }, "*");
    }
  };

  if (themeLoading) return null;
  if (!tenantKey) return null;
  if (!isEnabled) return null;

  return (
    <div
      style={{
        ...cssVars,
        fontFamily: "var(--fontFamily)",
        fontSize: "var(--fontSize)",
        color: "var(--text)",
        pointerEvents: "none",
      }}
    >
      {/* Floating Button */}
      <div
        className="fixed z-50"
        style={{
          ...btnPos,
          pointerEvents: "auto",
        }}
      >
        {hover && !open && (
          <div
            className="absolute z-50"
            style={{
              ...(position.includes("top") ? { top: 56 } : { bottom: 56 }),
              ...(position.includes("left") ? { left: 0 } : { right: 0 }),
            }}
          >
            <div className="relative">
              <div className="py-2 text-xs text-white text-center bg-[#0B1220] rounded-[10px] min-w-[160px]">
                Need Help? Chat with us
              </div>
              <div
                className="absolute w-3 h-3 rotate-45 bg-[#0B1220]"
                style={{
                  ...(position.includes("top") ? { top: -6 } : { bottom: -6 }),
                  ...(position.includes("left") ? { left: 24 } : { right: 24 }),
                }}
              />
            </div>
          </div>
        )}

        <div
          ref={widgetRef}
          className="rounded-full flex items-center justify-center bg-white p-1 border border-gray-200"
          style={{ borderRadius: "var(--radius)" }}
        >
          <button
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => {
              if (!open) {
                openModal();
              } else {
                minimizeChat();
              }
            }}
            className="w-10 h-10 flex items-center justify-center transition-all duration-300 overflow-hidden"
            style={{
              background: "var(--fabBg)",
              color: "var(--bodyBg)",
              borderRadius: "var(--radius)",
            }}
            title="Chat"
          >
            {isExternalIcon ? (
              (() => {
                const IconComponent = externalIconsMap[externalIconId];

                return IconComponent ? (
                  <IconComponent size={18} />
                ) : (
                  <MessageSquareIcon size={20} />
                );
              })()
            ) : chatIconUrl ? (
              <img
                src={chatIconUrl}
                alt="Chat"
                style={{ width: 18, height: 18, objectFit: "contain" }}
              />
            ) : (
              <MessageSquareIcon size={20} />
            )}
          </button>
        </div>
      </div>

      {/* Modal */}
      {open && (
        <div
          className="fixed z-50 flex flex-col items-end justify-end"
          style={{
            ...modalPos,
            width:
              window.innerWidth >= 1024 ? `${dimensions.width}px` : "360px",
            pointerEvents: "auto",
          }}
        >
          <div
            ref={modalRef}
            className="relative overflow-hidden shadow-2xl rounded-xl w-full"
            style={{
              background: "var(--panelBg)",
              height:
                window.innerWidth >= 1024
                  ? `${dimensions.height + 120}px`
                  : "auto",
            }}
          >
            {/* Resize Handles - only desktop */}
            <div className="hidden lg:block">
              <div
                className="absolute top-0 h-full w-2 z-[70]"
                style={{
                  cursor: "ew-resize",
                  ...(position.includes("right") ? { left: 0 } : { right: 0 }),
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  isResizing.current = "x";
                  lastMouseRef.current = { x: e.clientX, y: e.clientY };
                  document.body.style.cursor = "ew-resize";
                }}
              />

              <div
                className="absolute left-0 w-full h-2 z-[70]"
                style={{
                  cursor: "ns-resize",
                  ...(position.includes("bottom") ? { top: 0 } : { bottom: 0 }),
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  isResizing.current = "y";
                  lastMouseRef.current = { x: e.clientX, y: e.clientY };
                  document.body.style.cursor = "ns-resize";
                }}
              />

              <div
                className="absolute w-4 h-4 z-[80]"
                style={{
                  cursor: "nwse-resize",
                  ...(position.includes("right") ? { left: 0 } : { right: 0 }),
                  ...(position.includes("bottom") ? { top: 0 } : { bottom: 0 }),
                }}
                onMouseDown={(e) => {
                  e.preventDefault();
                  isResizing.current = "xy";
                  lastMouseRef.current = { x: e.clientX, y: e.clientY };
                  document.body.style.cursor = "nwse-resize";
                }}
              />
            </div>

            {/* Header */}
            <div
              className="p-4 flex justify-between text-white"
              style={{ background: "var(--headerBg)" }}
            >
              <div className="flex justify-start gap-2 items-center">
                <div className="p-2 rounded-full text-white ">
                  {isExternalIcon ? (
                    (() => {
                      const IconComponent = externalIconsMap[externalIconId];
                      return IconComponent ? <IconComponent size={20} /> : <MessageSquareIcon size={20} />;
                    })()
                  ) : chatIconUrl ? (
                    <img
                      src={chatIconUrl}
                      alt="Chat"
                      style={{ width: 20, height: 20, objectFit: "contain" }}
                    />
                  ) : (
                    <MessageSquareIcon size={20} />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-sm">Techween Support</div>

                  <div className="text-[10px] flex items-center gap-2">
                    <span className="flex items-center gap-1">
                      <span className="text-[#05DF72]">●</span> Online
                    </span>
                    <span style={{ opacity: 0.9 }}>
                      {isConnected ? "Connected" : "Connecting..."}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                <button onClick={minimizeChat} title="Minimize">
                  <Minus size={16} className="cursor-pointer" />
                </button>
                <button onClick={closeChat} title="Close">
                  <X size={16} className="cursor-pointer" />
                </button>
              </div>
            </div>

            {/* Body */}
            <div
              className="p-3 overflow-y-auto chat-scroll"
              ref={listRef}
              style={{
                background: "var(--bodyBg)",
                height:
                  window.innerWidth >= 1024 ? `${dimensions.height}px` : "360px",
              }}
            >
              {loadingIntro && messages.length === 0 ? (
                <div className="h-full flex items-center justify-center flex-col space-y-3">
                  <MessageSquareIcon size={40} className="text-gray-400" />
                  <p className="text-xs text-gray-400">
                    Starting conversation...
                  </p>
                  <WaveLoader dots={3} />
                </div>
              ) : (
                <>
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`mb-3 ${m.sender === "user" ? "text-right" : "text-left"
                        }`}
                    >
                      <div
                        className={`flex items-center gap-2 mb-1 ${m.sender === "user" ? "flex-row-reverse" : "flex-row"
                          }`}
                      >
                        <div
                          className="w-5 h-5 flex items-center justify-center rounded-md text-white"
                          style={{
                            background:
                              m.sender === "user"
                                ? "var(--userBubbleBg)"
                                : "var(--primary)",
                          }}
                        >
                          {m.sender === "user" ? (
                            <User size={10} />
                          ) : (
                            <Bot size={10} />
                          )}
                        </div>
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--textMuted)" }}
                        >
                          {m.time}
                        </span>
                      </div>

                      <div
                        className="inline-block px-3 py-1 rounded-lg text-xs"
                        style={{
                          background: "#f3f0ff",
                        }}
                      >
                        {m.text}
                      </div>
                    </div>
                  ))}

                  {isTyping && (
                    <div className="mb-3 text-left">
                      <div className="flex items-center gap-2 mb-1">
                        <div
                          className="w-5 h-5 flex items-center justify-center rounded-full text-white"
                          style={{ background: "var(--primary)" }}
                        >
                          <Bot size={10} />
                        </div>
                        <span
                          className="text-[10px]"
                          style={{ color: "var(--textMuted)" }}
                        >
                          typing...
                        </span>
                      </div>
                      <div
                        className="inline-block px-3 py-2 rounded-xl text-sm"
                        style={{
                          background: "var(--aiBubbleBg)",
                          color: "var(--aiBubbleText)",
                          borderRadius: "var(--radius)",
                        }}
                      >
                        <WaveLoader dots={3} />
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* Input Area */}
            <div className="p-3 border-t border-gray-100">
              <div className="flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
                  className="flex-1 px-3 py-2 rounded-md outline-none text-xs border border-gray-100"
                  style={{
                    color: "var(--searchbarText)",
                  }}
                  placeholder={inputPlaceholder}
                />
                <button
                  onClick={() => sendMessage(input)}
                  className="p-2 rounded-lg text-white shadow-sm"
                  style={{
                    background: "var(--primary)",
                  }}
                  disabled={!input.trim()}
                >
                  <MessageSquareIcon size={16} className="cursor-pointer" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WaveLoader({ dots = 3, size = 5, gap = 3, lift = 3 }) {
  return (
    <div className="flex items-center justify-center" style={{ gap }}>
      {Array.from({ length: dots }).map((_, i) => (
        <span
          key={i}
          className="wave-dot"
          style={{ width: size, height: size, animationDelay: `${i * 0.15}s` }}
        />
      ))}
      <style>{`
        .wave-dot { border-radius: 50%; background-color: var(--primary); opacity: 0.4; animation: wave 1.2s infinite ease-in-out; }
        @keyframes wave { 0%, 100% { transform: translateY(0); opacity: 0.4; } 50% { transform: translateY(-${lift}px); opacity: 1; } }
      `}</style>
    </div>
  );
}