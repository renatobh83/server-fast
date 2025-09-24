(function () {
  if (window.__chatWidgetLoaded) return; // evita duplicação
  window.__chatWidgetLoaded = true;

  const loadScript = (src, callback) => {
    const script = document.createElement("script");
    script.src = src;
    script.onload = callback;
    document.head.appendChild(script);
  };

  loadScript("https://cdn.socket.io/4.7.2/socket.io.min.js", () => {
    const API_URL = "https://fast.panelapps.site";
    let socket;
    let chatVisible = false;
    let chatToken = localStorage.getItem("chat_token");
    let formContainer = null;
    let chatMessages = null;
    let loadingOlder = false;
    let offset = 0;
    let sendCooldown = false;
    const chatButton = document.createElement("div");
    chatButton.innerText = "💬";
    Object.assign(chatButton.style, {
      position: "fixed",
      bottom: "2rem",
      right: "2rem",
      background: "#007bff",
      color: "#fff",
      borderRadius: "50%",
      width: "3.5rem",
      height: "3.5rem",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      fontSize: "1.5rem",
      cursor: "pointer",
      zIndex: 9999,
      boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
    });
    document.body.appendChild(chatButton);

    chatButton.addEventListener("click", () => {
      chatVisible = !chatVisible;

      if (chatVisible) {
        if (!formContainer) {
          showPreForm();
        } else {
          formContainer.style.display = "block";
        }
      } else {
        if (formContainer) formContainer.style.display = "none";
      }
    });

    if (chatToken) {
      chatVisible = true;
      connectSocket();
    }
    function showDesktopNotification(title, body) {
      if (Notification.permission === "granted") {
        const notification = new Notification(title, {
          body: body,
          icon: "https://cdn-icons-png.flaticon.com/512/1034/1034141.png", // opcional
        });

        // Fecha a notificação após 5s
        setTimeout(() => notification.close(), 5000);
      }
    }
    function showPreForm() {
      formContainer = document.createElement("div");
      formContainer.innerHTML = `
                <div style="position: fixed;
                bottom: 6rem;
                right: 2rem;
                background: #fff;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15);
                width: 320px; font-family: sans-serif; z-index: 9992;">
                    <h3 style="margin-top: 0; font-size: 1.2rem; color: #333;">Iniciar Atendimento</h3>
                    <label style="display: block; margin-bottom: 8px; color: #555;">Nome</label>
                    <input id="chat-name" placeholder="Digite seu nome" style="width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;"" />
                    <label style="display: block; margin-bottom: 8px; color: #555;">E-mail</label>
                    <input type="email" required id="chat-email" placeholder="Digite seu e-mail" style="width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;"" />
                    <label style="display: block; margin-bottom: 8px; color: #555;">CNPJ</label>
                    <input id="chat-cnpj" type="number"  inputmode="numeric" required placeholder="Digite seu cnpj" maxlength="14" value="18273094000132" style="width: 100%; padding: 10px; margin-bottom: 20px; border: 1px solid #ccc; border-radius: 8px; box-sizing: border-box;"" />
                    <button id="chat-start-btn" style="width: 100%; padding: 12px; background: #007bff; color: #fff; border: none; border-radius: 8px; font-size: 16px; cursor: pointer;">Iniciar Chat</button>
                </div>
            `;
      document.body.appendChild(formContainer);

      document
        .getElementById("chat-start-btn")
        .addEventListener("click", async () => {
          const name = document.getElementById("chat-name").value;
          const email = document.getElementById("chat-email").value;
          const identifier = document.getElementById("chat-cnpj").value;

          if (!name || !email || !identifier)
            return showToast("Preencha todos os campos.", "error"); //alert("Preencha todos os campos.");
          if (!validateEmail(email)) {
            showToast("Digite um e-mail válido.", "error");
            return;
          }
          const startBtn = document.getElementById("chat-start-btn");
          // Troca texto e desativa
          startBtn.textContent = "Iniciando...";
          startBtn.disabled = true;
          try {
            const res = await fetch(`${API_URL}/api/chatClient/token`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name, email, identifier }),
            });
            const { token, error } = await res.json();

            if (error) {
              showToast(error, "error");
              startBtn.textContent = "Iniciar Chat"; // volta
              startBtn.disabled = false;
              return;
            }
            showToast(
              "Aguarde um técnico para iniciar o atendimento.",
              "success"
            );
            chatToken = token;
            localStorage.setItem("chat_token", token);
            formContainer.remove();
            connectSocket();
          } catch (err) {
            console.error("Erro ao gerar token", err);
            showToast("Não foi possível iniciar o chat.", "error");
            startBtn.textContent = "Iniciar Chat";
            startBtn.disabled = false;
          }
        });
    }

    function connectSocket() {
      if (formContainer) formContainer.remove();
      socket = io(API_URL, {
        auth: { token: chatToken },
        transports: ["websocket"],
      });
      socket.on("chat:ready", () => {
        console.log("Conexão pronta, agora posso pedir mensagens");
        loadMessages(); // aqui sim faz o emit
        hideLoading();
      });

      socket.on("connect", () => {
        console.log("Conectado ao socket", socket.id);
        openChatUI();
      });
      socket.on("chat:reply", (msg) => {
        if (loadingOlder) hideLoading();
        const nome = extrairNome(msg);
        const mensagemSemNome = msg.replace(/\*(.*?)\*:\s*/, ""); // Remove o nome da mensagem
        appendMessage(nome, mensagemSemNome, Date.now());
        playSound();
        try {
          notify("Nova mensagem", msg);
        } catch (e) {
          console.error("Erro ao exibir notificação:", e);
        }
        //  notify("Nova mensagem", msg);

        console.log(loadingOlder);
      });
      socket.on("chat:image", (data) =>
        appendImage(data.url, Date.now(), true)
      );

      socket.on("chat:previousMessages", (messages) => {
        if (offset === 0) chatMessages.innerHTML = "";
        hideLoading();
        const scrollBefore = chatMessages.scrollHeight;

        messages.forEach((msg) => {
          const timestamp = msg.timestamp || Date.now();
          let el;
          if (msg.mediaType === "image") {
            const link = `${API_URL}/public/${msg.mediaUrl}`;
            el = createImageElement(link, timestamp, msg.fromMe, msg.id);
          } else {
            if (msg.fromMe) {
              const nome = extrairNome(msg.body);
              const mensagemSemNome = msg.body.replace(/\*(.*?)\*:\s*/, "");
              el = createMessageElement(
                nome,
                mensagemSemNome,
                timestamp,
                msg.id
              );
            } else {
              el = createMessageElement("Você", msg.body, timestamp, msg.id);
            }
          }
          chatMessages.insertBefore(el, chatMessages.firstChild);
        });

        chatMessages.scrollTo({
          top: chatMessages.scrollHeight - scrollBefore,
          behavior: "smooth",
        });

        loadingOlder = false;
      });

      socket.on("chat:closedTicket", (msg) => {
        showToast(msg, "success");
        socket.disconnect();
        localStorage.removeItem("chat_token");
        formContainer.remove();
        formContainer = null;
        offset = 0;
        chatToken = null;
        chatVisible = false;
      });
      socket.on("connect_error", (err) => {
        console.error("Erro de conexão:", err.message);
        if (err.message.includes("invalid token")) {
          showToast("Sessão expirada. Recarregue e inicie novamente.", "error");
          localStorage.removeItem("chat_token");
        }
      });
    }

    function openChatUI() {
      formContainer = document.createElement("div");
      formContainer.innerHTML = `
                <style>
                    .chat-message { display: flex;  margin: 8px 0; max-width: 80%;justify-content: flex-start; }
                    .chat-client { justify-content: flex-end; margin-left: auto; text-align: right; }
                    .chat-agent { justify-content: flex-start; margin-right: auto; text-align: left; }
                    .message-wrapper {
  max-width: 75%;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
}
  .chat-client .message-wrapper {
  align-items: flex-end;
}
.message-sender {
  font-weight: bold;
  margin-right: 6px;


}
  .message-meta {
  font-size: 11px;
  color: #777;
  margin-bottom: 4px;
}

.message-time {
  color: #999;
}
  .message-content {
  background-color: #f0f0f0;
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  color: #333;
}

.chat-client .message-content {
  background-color: #DCF8C6; /* estilo WhatsApp */
}

                    .chat-client .message-content { background: #d1e7ff; color: #000; }
                </style>

                <div style="position: fixed; bottom: 6rem; right: 2rem; background: white; border: 1px solid #ccc; border-radius: 12px; box-shadow: 0 4px 10px rgba(0, 0, 0, 0.15); width: 320px; padding: 12px; height: 400px; display: flex; flex-direction: column; z-index: 9999;">
                    <div style="display: flex; justify-content: space-between; align-items: center">
                        <small style="color: #999;">Conectado ao atendimento</small>
                        <button id="chat-close-btn" style="background: transparent; border: none; font-size: 16px; cursor: pointer;">✖</button>
                    </div>
                    <div id="chat-messages" style="flex: 1; padding: 10px; overflow-y: auto;">
                        <div id="chat-loading" style="text-align: center; color: #777;    ">Carregando mensagens...</div>
                    </div>

                 <div style="display: flex; align-items: center; gap: 8px; position: relative;">
    <input id="chat-input" placeholder="Digite sua mensagem"
        style="flex: 1; padding: 8px 8px 8px 32px; border: 1px solid #ccc; border-radius: 8px; font-size: 14px;" />

    <!-- Ícone de anexo posicionado dentro do input -->
    <label for="file-upload" style="position: absolute; left: 10px; cursor: pointer; font-size: 18px;">📎</label>
    <input type="file" id="file-upload" accept="image/*" style="display:none" />

    <button id="chat-send-btn"
        style="padding: 8px 10px; background: #007bff; color: white; border: none; border-radius: 6px; cursor: pointer;">➤</button>
</div>

                </div>
            `;
      document.body.appendChild(formContainer);
      chatMessages = document.getElementById("chat-messages"); // 👈 aqui está certo
      const chatInput = document.getElementById("chat-input");

      // Eventos
      chatInput.addEventListener("paste", handlePaste);
      document
        .getElementById("chat-send-btn")
        .addEventListener("click", sendMessage);
      document.getElementById("chat-input").addEventListener("keydown", (e) => {
        if (e.key === "Enter" && e.target.value.trim()) {
          e.preventDefault();
          sendMessage();
        }
      });
      document
        .getElementById("file-upload")
        .addEventListener("change", handleFileInputChange);
      document
        .getElementById("chat-close-btn")
        .addEventListener("click", async () => {
          if (confirm("Deseja encerrar o atendimento?")) {
            socket.disconnect();
            localStorage.removeItem("chat_token");
            formContainer.remove();
            formContainer = null;
            offset = 0;
            chatToken = null;
            chatVisible = false;
          }
        });

      chatMessages.addEventListener("scroll", () => {
        if (chatMessages.scrollTop === 0) {
          loadMessages();
          console.log("ontop");
        }
      });
    }
    // Toast artesanal
    function createToastContainer() {
      const container = document.createElement("div");
      container.id = "toast-container";
      Object.assign(container.style, {
        position: "fixed",
        top: "100px",
        right: "20px",
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        zIndex: 10000,
      });
      document.body.appendChild(container);
    }
    function showToast(message, type = "info") {
      if (!document.getElementById("toast-container")) createToastContainer();

      const toast = document.createElement("div");
      toast.textContent = message;

      Object.assign(toast.style, {
        padding: "12px 16px",
        background:
          type === "error"
            ? "#dc3545"
            : type === "success"
            ? "#28a745"
            : "#333",
        color: "white",
        borderRadius: "8px",
        boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
        fontSize: "14px",
        opacity: "0",
        transform: "translateY(20px)",
        transition: "opacity 0.3s ease, transform 0.3s ease",
      });

      document.getElementById("toast-container").appendChild(toast);

      requestAnimationFrame(() => {
        toast.style.opacity = "1";
        toast.style.transform = "translateY(0)";
      });

      setTimeout(() => {
        toast.style.opacity = "0";
        toast.style.transform = "translateY(20px)";
        setTimeout(() => toast.remove(), 300);
      }, 3000);
    }
    function validateEmail(email) {
      const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return re.test(email);
    }
    function handleFileInputChange(event) {
      const file = event.target.files[0];
      if (file) {
        uploadFile(file);
      }
    }
    function sendMessage() {
      const input = document.getElementById("chat-input");
      const msg = input.value.trim();
      if (sendCooldown || !msg.trim()) return;
      sendCooldown = true;
      setTimeout(() => (sendCooldown = false), 300);
      socket.emit("chat:message", msg);
      appendMessage("Você", msg, Date.now());
      input.value = "";
    }
    function handlePaste(event) {
      const clipboardItems = event.clipboardData.items;

      for (let i = 0; i < clipboardItems.length; i++) {
        const item = clipboardItems[i];

        if (item.type.startsWith("image/")) {
          const file = item.getAsFile();
          if (file) {
            const urlImg = window.URL.createObjectURL(file);
            uploadFile(file);
            break;
          }
        }
      }
    }

    function appendMessage(
      sender,
      text,
      timestamp = Date.now(),
      id = Date.now()
    ) {
      // const messages = document.getElementById("chat-messages");
      const el = document.createElement("div");
      const isClient = sender === "Você";
      el.className = isClient
        ? "chat-message chat-client"
        : "chat-message chat-agent";
      el.innerHTML = ` <div id="${id}" class="message-wrapper">
                            <div class="message-meta">
                            <span class="message-sender">${sender}</span>
                            <span class="message-time">${formatTime(
                              timestamp
                            )}</span>
                            </div>
                            <div class="message-content">
                            ${text}
                            </div>
                        </div>`;

      chatMessages.appendChild(el);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    function createMessageElement(
      sender,
      text,
      timestamp = Date.now(),
      id = Date.now()
    ) {
      // const messages = document.getElementById("chat-messages");
      const el = document.createElement("div");
      const isClient = sender === "Você";
      el.className = isClient
        ? "chat-message chat-client"
        : "chat-message chat-agent";
      el.innerHTML = ` <div id="${id}" class="message-wrapper">
                            <div class="message-meta">
                            <span class="message-sender">${sender}</span>
                            <span class="message-time">${formatTime(
                              timestamp
                            )}</span>
                            </div>
                            <div class="message-content">
                            ${text}
                            </div>
                        </div>`;
      return el;
    }
    function formatTime(timestamp) {
      const date = new Date(Number(timestamp));
      return date.toLocaleTimeString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    function extrairNome(mensagem) {
      const regex = /\*(.*?)\*/;
      const match = mensagem.match(regex);
      return match ? match[1] : "Atendente";
    }

    function appendImage(url, timestamp = Date.now(), sender, id = Date.now()) {
      const el = document.createElement("div");
      el.className = !sender
        ? "chat-message chat-client"
        : "chat-message chat-agent";
      el.innerHTML = `
                    <div class="message-content" id=${id}>
                          <a href="${url}" target="_blank" rel="noopener noreferrer">
                            <img src="${url}" style="max-width: 100%; border-radius: 8px; margin-top: 8px;" crossorigin="anonymous" />
                          </a>
                        <div style="font-size: 11px; color: #777; margin-top: 4px;">${formatTime(
                          timestamp
                        )}</div>
                    </div>
            `;

      chatMessages.appendChild(el);
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    function createImageElement(
      url,
      timestamp = Date.now(),
      sender,
      id = Date.now()
    ) {
      const el = document.createElement("div");
      el.className = !sender
        ? "chat-message chat-client"
        : "chat-message chat-agent";
      el.innerHTML = `
                    <div class="message-content" id=${id}>
                        <a href="${url}" target="_blank" rel="noopener noreferrer">
                            // <img src="${url}" style="max-width: 100%; border-radius: 8px; margin-top: 8px;" crossorigin="anonymous" />
                         </a>
                        <div style="font-size: 11px; color: #777; margin-top: 4px;">${formatTime(
                          timestamp
                        )}</div>
                    </div>
            `;
      return el;
    }
    async function uploadFile(file) {
      if (!file) return;

      const formData = new FormData();
      formData.append("file", file);

      try {
        const res = await fetch(`${API_URL}/api/chatClient/upload`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${chatToken}`,
          },
          body: formData,
        });
        const data = await res.json();
        if (data.url) {
          socket.emit("chat:image", data.url);
          appendImage(data.url, Date.now(), false);
        } else {
          showToast("Erro ao enviar imagem", "error");
        }
      } catch (err) {
        console.error(err);
        showToast("Erro ao enviar imagem", "error");
      }
    }

    function loadMessages() {
      loadingOlder = true;
      showLoading();
      socket.emit("chat:getMessages", { offset });
      offset += 50;
    }
    function showLoading() {
      document.getElementById("chat-loading").style.display = "block";
    }

    function hideLoading() {
      document.getElementById("chat-loading").style.display = "none";
    }
    function playSound() {
      const audio = new Audio(
        "https://notificationsounds.com/storage/sounds/file-sounds-1147-that-was-quick.mp3"
      );
      audio.play().catch(console.error);
    }

    function notify(title, body) {
      if (Notification.permission === "granted") {
        new Notification(title, { body });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new Notification(title, { body });
          }
        });
      }
    }
  });
})();
