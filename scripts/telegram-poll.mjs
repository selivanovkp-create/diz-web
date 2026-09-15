#!/usr/bin/env node
/**
 * Long-polling Telegram bot for /start → Mini App button.
 * Runs without webhook (works with GitHub Pages static hosting).
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = (process.env.APP_URL || "https://selivanovkp-create.github.io/diz-web").replace(
  /\/$/,
  "",
);

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN required");
  process.exit(1);
}

let offset = 0;

async function api(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  return res.json();
}

async function handleUpdate(update) {
  const msg = update.message;
  const text = msg?.text?.trim() ?? "";
  if (!msg || !text) return;
  if (!text.startsWith("/start") && !text.startsWith("/app")) return;

  const name = msg.from?.first_name ?? "друг";
  await api("sendMessage", {
    chat_id: msg.chat.id,
    text: [
      `Привет, ${name}.`,
      "",
      "FORMA — система, которая превращает «хочу стать лучше» в конкретный план на сегодня.",
      "",
      "Открой приложение кнопкой ниже или через меню FORMA.",
    ].join("\n"),
    reply_markup: {
      inline_keyboard: [[{ text: "Открыть FORMA", web_app: { url: appUrl } }]],
    },
  });
  await api("setChatMenuButton", {
    chat_id: msg.chat.id,
    menu_button: {
      type: "web_app",
      text: "FORMA",
      web_app: { url: appUrl },
    },
  });
  console.log("handled /start for", msg.chat.id);
}

async function loop() {
  console.log("polling bot… app:", appUrl);
  // drop webhook so polling works
  await api("deleteWebhook", { drop_pending_updates: false });
  await api("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "FORMA",
      web_app: { url: appUrl },
    },
  });
  console.log("default menu button set");

  for (;;) {
    try {
      const data = await api("getUpdates", {
        offset,
        timeout: 30,
        allowed_updates: ["message"],
      });
      if (!data.ok) {
        console.error(data);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      for (const u of data.result) {
        offset = u.update_id + 1;
        await handleUpdate(u);
      }
    } catch (e) {
      console.error("poll error", e);
      await new Promise((r) => setTimeout(r, 3000));
    }
  }
}

loop();
