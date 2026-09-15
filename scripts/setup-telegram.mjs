#!/usr/bin/env node
/**
 * Configure Telegram Mini App for FORMA bot.
 * Usage: TELEGRAM_BOT_TOKEN=... APP_URL=https://... node scripts/setup-telegram.mjs
 */
const token = process.env.TELEGRAM_BOT_TOKEN;
const appUrl = (process.env.APP_URL || "").replace(/\/$/, "");
const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET || "forma_wh_secret";

if (!token || !appUrl) {
  console.error("Need TELEGRAM_BOT_TOKEN and APP_URL");
  process.exit(1);
}

async function api(method, body) {
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  const json = await res.json();
  if (!json.ok) {
    console.error(method, json);
    throw new Error(method + " failed");
  }
  return json.result;
}

async function main() {
  const me = await api("getMe");
  console.log("bot:", me.username);

  await api("setChatMenuButton", {
    menu_button: {
      type: "web_app",
      text: "FORMA",
      web_app: { url: appUrl },
    },
  });
  console.log("menu button →", appUrl);

  await api("setMyCommands", {
    commands: [
      { command: "start", description: "Открыть FORMA" },
      { command: "app", description: "Запустить Mini App" },
    ],
  });

  const webhookUrl = `${appUrl}/api/telegram/webhook`;
  await api("setWebhook", {
    url: webhookUrl,
    secret_token: webhookSecret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  });
  console.log("webhook →", webhookUrl);

  const info = await api("getWebhookInfo");
  console.log("webhook info:", info);

  console.log("\nOpen: https://t.me/" + me.username);
  console.log("Direct web_app attempt via /start after messaging the bot.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
