(function () {
  if (window.GolfCourseChatbot) return;

  function getCurrentScript() {
    return document.currentScript || (function () {
      const scripts = document.getElementsByTagName("script");
      return scripts[scripts.length - 1];
    })();
  }

  function getCourseIdFromScript() {
    const script = getCurrentScript();
    if (!script || !script.src) return null;

    try {
      const url = new URL(script.src);
      return url.searchParams.get("course");
    } catch (e) {
      return null;
    }
  }

  window.GolfCourseChatbot = {
    init: function (options = {}) {
      const scriptCourseId = getCourseIdFromScript();

      const apiBase =
        options.apiBase ||
        "https://golf-course-chatbot.onrender.com";

      const courseId =
        options.courseId ||
        scriptCourseId;

      if (!apiBase || !courseId) {
        console.error("GolfCourseChatbot requires a courseId.");
        return;
      }

      let isOpen = false;
      let courseConfig = {
        course_name: "Golf Course",
        theme_color: "#1f6f3e",
        welcome_message: "Welcome! How can I help you today?",
        quick_questions: []
      };

      const style = document.createElement("style");
      style.innerHTML = `
        #golf-chat-launcher {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 60px;
          height: 60px;
          border-radius: 50%;
          border: none;
          color: white;
          font-size: 24px;
          cursor: pointer;
          box-shadow: 0 6px 18px rgba(0,0,0,0.2);
          z-index: 999999;
        }

        #golf-chat-window {
          position: fixed;
          bottom: 95px;
          right: 20px;
          width: 360px;
          max-width: calc(100vw - 24px);
          height: 560px;
          background: white;
          border-radius: 16px;
          box-shadow: 0 12px 32px rgba(0,0,0,0.22);
          overflow: hidden;
          display: none;
          flex-direction: column;
          z-index: 999999;
          font-family: Arial, sans-serif;
        }

        #golf-chat-header {
          color: white;
          padding: 16px;
          font-weight: bold;
          font-size: 16px;
        }

        #golf-chat-messages {
          flex: 1;
          padding: 14px;
          overflow-y: auto;
          background: #f7f7f7;
        }

        .golf-chat-bubble {
          max-width: 85%;
          padding: 10px 12px;
          border-radius: 14px;
          margin-bottom: 10px;
          line-height: 1.4;
          font-size: 14px;
          word-wrap: break-word;
        }

        .golf-chat-bot {
          background: white;
          border: 1px solid #ddd;
          color: #222;
        }

        .golf-chat-user {
          margin-left: auto;
          color: white;
        }

        #golf-chat-quick {
          padding: 10px 14px 0;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          background: #fff;
        }

        .golf-chat-chip {
          border: 1px solid #ddd;
          background: #fff;
          border-radius: 999px;
          padding: 8px 10px;
          font-size: 12px;
          cursor: pointer;
        }

        #golf-chat-input-row {
          display: flex;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid #eee;
          background: white;
        }

        #golf-chat-input {
          flex: 1;
          border: 1px solid #ccc;
          border-radius: 999px;
          padding: 10px 12px;
          font-size: 14px;
          outline: none;
        }

        #golf-chat-send {
          border: none;
          color: white;
          border-radius: 999px;
          padding: 10px 14px;
          cursor: pointer;
          font-weight: bold;
        }

        @media (max-width: 520px) {
          #golf-chat-window {
            right: 12px;
            left: 12px;
            width: auto;
            height: 70vh;
            bottom: 84px;
          }

          #golf-chat-launcher {
            right: 16px;
            bottom: 16px;
          }
        }
      `;
      document.head.appendChild(style);

      const launcher = document.createElement("button");
      launcher.id = "golf-chat-launcher";
      launcher.innerHTML = "💬";

      const chatWindow = document.createElement("div");
      chatWindow.id = "golf-chat-window";
      chatWindow.innerHTML = `
        <div id="golf-chat-header">Golf Course Assistant</div>
        <div id="golf-chat-messages"></div>
        <div id="golf-chat-quick"></div>
        <div id="golf-chat-input-row">
          <input id="golf-chat-input" type="text" placeholder="Type your message..." />
          <button id="golf-chat-send">Send</button>
        </div>
      `;

      document.body.appendChild(launcher);
      document.body.appendChild(chatWindow);

      const header = chatWindow.querySelector("#golf-chat-header");
      const messages = chatWindow.querySelector("#golf-chat-messages");
      const quick = chatWindow.querySelector("#golf-chat-quick");
      const input = chatWindow.querySelector("#golf-chat-input");
      const sendBtn = chatWindow.querySelector("#golf-chat-send");

      function applyTheme() {
        launcher.style.background = courseConfig.theme_color || "#1f6f3e";
        header.style.background = courseConfig.theme_color || "#1f6f3e";
        sendBtn.style.background = courseConfig.theme_color || "#1f6f3e";
        header.textContent = courseConfig.course_name || "Golf Course Assistant";
      }

      function addMessage(text, sender) {
        const bubble = document.createElement("div");
        bubble.className = `golf-chat-bubble ${sender === "user" ? "golf-chat-user" : "golf-chat-bot"}`;
        bubble.innerHTML = text;

        if (sender === "user") {
          bubble.style.background = courseConfig.theme_color || "#1f6f3e";
        }

        messages.appendChild(bubble);
        messages.scrollTop = messages.scrollHeight;
      }

      function renderQuickQuestions() {
        quick.innerHTML = "";
        const questions = courseConfig.quick_questions || [];

        questions.slice(0, 4).forEach((q) => {
          const chip = document.createElement("button");
          chip.className = "golf-chat-chip";
          chip.textContent = q;
          chip.onclick = function () {
            sendMessage(q);
          };
          quick.appendChild(chip);
        });
      }

      async function loadConfig() {
        try {
          const res = await fetch(`${apiBase}/course-config/${courseId}`);
          const data = await res.json();
          courseConfig = data;
          applyTheme();
          renderQuickQuestions();

          messages.innerHTML = "";
          addMessage(courseConfig.welcome_message || "Welcome! How can I help you today?", "bot");
        } catch (err) {
          console.error("Could not load course config", err);
          addMessage("Sorry, the chatbot could not load right now.", "bot");
        }
      }

      async function sendMessage(messageText) {
        const text = (messageText || input.value).trim();
        if (!text) return;

        addMessage(text, "user");
        input.value = "";

        try {
          const res = await fetch(`${apiBase}/chat`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              course_id: courseId,
              message: text
            })
          });

          const data = await res.json();
          addMessage(data.answer || "Sorry, I couldn't get a response.", "bot");
        } catch (err) {
          addMessage("Sorry, something went wrong. Please try again.", "bot");
        }
      }

      launcher.onclick = function () {
        isOpen = !isOpen;
        chatWindow.style.display = isOpen ? "flex" : "none";
      };

      sendBtn.onclick = function () {
        sendMessage();
      };

      input.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          sendMessage();
        }
      });

      loadConfig();
    }
  };

  const autoCourseId = getCourseIdFromScript();
  if (autoCourseId) {
    window.GolfCourseChatbot.init({
      courseId: autoCourseId
    });
  }
})();
