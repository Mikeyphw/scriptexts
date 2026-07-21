(() => {
  const { ACTIONS, utils, ext } = globalThis.TMD_COMMON;
  const chatsEl = document.getElementById("chats");
  const entriesEl = document.getElementById("entries");
  const titleEl = document.getElementById("title");
  let currentChatKey = "";

  async function loadChats() {
    const response = await ext.runtime.sendMessage({ type: ACTIONS.GET_ALL_INDEX_SUMMARY });
    const chats = response?.value || [];
    chatsEl.textContent = "";
    if (!chats.length) {
      const p = document.createElement("p");
      p.textContent = "No indexed chats yet.";
      chatsEl.appendChild(p);
    }
    chats.forEach((chat) => {
      const button = document.createElement("button");
      button.className = "chat";
      button.textContent = `${chat.chatLabel} (${chat.count})`;
      button.addEventListener("click", () => {
        currentChatKey = chat.chatKey;
        renderChat(chat.chatKey, chat.chatLabel);
      });
      chatsEl.appendChild(button);
    });
  }

  async function renderChat(chatKey, label) {
    const response = await ext.runtime.sendMessage({ type: ACTIONS.GET_CHAT_MEDIA, chatKey });
    const entries = response?.value?.entries || [];
    titleEl.textContent = `${label} (${entries.length})`;
    entriesEl.textContent = "";
    if (!entries.length) {
      const p = document.createElement("p");
      p.textContent = "No entries.";
      entriesEl.appendChild(p);
      return;
    }
    entries.forEach((entry) => {
      const card = document.createElement("article");
      card.className = "entry";
      const preview = entry.previewUrl || (entry.type === "image" ? entry.originalUrl : "");
      if (preview) {
        const img = document.createElement("img");
        img.src = preview;
        img.alt = "";
        card.appendChild(img);
      } else {
        const empty = document.createElement("div");
        empty.className = "meta";
        empty.textContent = "No preview";
        card.appendChild(empty);
      }

      const meta = document.createElement("div");
      meta.className = "meta";

      const strong = document.createElement("strong");
      strong.textContent = entry.type || "";

      const span = document.createElement("span");
      span.textContent = entry.duration || "";

      const small = document.createElement("small");
      small.textContent = entry.source || "";

      meta.appendChild(strong);
      meta.appendChild(span);
      meta.appendChild(small);
      card.appendChild(meta);
      entriesEl.appendChild(card);
    });
  }

  document.getElementById("export").addEventListener("click", async () => {
    if (!currentChatKey) return;
    const response = await ext.runtime.sendMessage({ type: ACTIONS.EXPORT_CHAT_INDEX, chatKey: currentChatKey });
    const blob = new Blob([JSON.stringify(response?.value || {}, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentChatKey}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });

  document.getElementById("clear").addEventListener("click", async () => {
    if (!currentChatKey) return;
    await ext.runtime.sendMessage({ type: ACTIONS.CLEAR_CHAT_INDEX, chatKey: currentChatKey });
    currentChatKey = "";
    titleEl.textContent = "Select a chat";
    entriesEl.innerHTML = "";
    await loadChats();
  });

  loadChats();
})();
