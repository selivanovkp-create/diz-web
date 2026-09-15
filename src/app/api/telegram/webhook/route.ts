import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type TgUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    text?: string;
    chat: { id: number; type: string };
    from?: { id: number; first_name?: string; language_code?: string };
  };
};

function appUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "https://selivanovkp-create.github.io/diz-web"
  ).replace(/\/$/, "");
}

async function tg(method: string, body: Record<string, unknown>) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN missing");
  const res = await fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}

export async function POST(req: NextRequest) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (secret) {
    const header = req.headers.get("x-telegram-bot-api-secret-token");
    if (header !== secret) {
      return NextResponse.json({ ok: false }, { status: 401 });
    }
  }

  let update: TgUpdate;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const msg = update.message;
  const text = msg?.text?.trim() ?? "";
  if (!msg || !text) return NextResponse.json({ ok: true });

  const url = appUrl();
  const name = msg.from?.first_name ?? "друг";

  if (text.startsWith("/start")) {
    await tg("sendMessage", {
      chat_id: msg.chat.id,
      text: [
        `Привет, ${name}.`,
        "",
        "FORMA — система, которая превращает «хочу стать лучше» в конкретный план на сегодня.",
        "",
        "Открой приложение кнопкой ниже.",
      ].join("\n"),
      reply_markup: {
        inline_keyboard: [
          [{ text: "Открыть FORMA", web_app: { url } }],
        ],
      },
    });

    await tg("setChatMenuButton", {
      chat_id: msg.chat.id,
      menu_button: {
        type: "web_app",
        text: "FORMA",
        web_app: { url },
      },
    });
  }

  return NextResponse.json({ ok: true });
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "forma-telegram-webhook",
    appUrl: appUrl(),
  });
}
