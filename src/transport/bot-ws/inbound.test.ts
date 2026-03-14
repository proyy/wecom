import { describe, expect, it } from "vitest";

import { mapBotWsFrameToInboundEvent } from "./inbound.js";
import type { ResolvedBotAccount } from "../../types/index.js";

function createBotAccount(): ResolvedBotAccount {
  return {
    accountId: "haidao",
    configured: true,
    primaryTransport: "ws",
    wsConfigured: true,
    webhookConfigured: false,
    config: {},
    ws: {
      botId: "bot-id",
      secret: "secret",
    },
    token: "",
    encodingAESKey: "",
    receiveId: "",
    botId: "bot-id",
    secret: "secret",
  };
}

describe("mapBotWsFrameToInboundEvent", () => {
  it("includes quote content in text events", () => {
    const event = mapBotWsFrameToInboundEvent({
      account: createBotAccount(),
      frame: {
        cmd: "aibot_msg_callback",
        headers: { req_id: "req-1" },
        body: {
          msgid: "msg-1",
          msgtype: "text",
          chattype: "group",
          chatid: "group-1",
          from: { userid: "user-1" },
          text: { content: "@daodao 这个线索价值" },
          quote: {
            msgtype: "text",
            text: { content: "原始引用内容" },
          },
        },
      },
    });

    expect(event.text).toBe("@daodao 这个线索价值\n\n> 原始引用内容");
  });
});
