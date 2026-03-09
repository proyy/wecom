import { generateReqId, type WsFrame, type BaseMessage, type EventMessage, type WSClient } from "@wecom/aibot-node-sdk";

import type { ReplyHandle, ReplyPayload } from "../../types/index.js";

export function createBotWsReplyHandle(params: {
  client: WSClient;
  frame: WsFrame<BaseMessage | EventMessage>;
  accountId: string;
  onDeliver?: () => void;
  onFail?: (error: unknown) => void;
}): ReplyHandle {
  let streamId: string | undefined;
  const resolveStreamId = () => {
    streamId ||= generateReqId("stream");
    return streamId;
  };

  return {
    context: {
      transport: "bot-ws",
      accountId: params.accountId,
      reqId: params.frame.headers.req_id,
      raw: {
        transport: "bot-ws",
        command: params.frame.cmd,
        headers: params.frame.headers,
        body: params.frame.body,
        envelopeType: "ws",
      },
    },
    deliver: async (payload: ReplyPayload, info) => {
      if (payload.isReasoning) {
        return;
      }
      const text = payload.text?.trim();
      if (!text) {
        return;
      }
      await params.client.replyStream(params.frame, resolveStreamId(), text, info.kind === "final");
      params.onDeliver?.();
    },
    fail: async (error: unknown) => {
      const message = error instanceof Error ? error.message : String(error);
      await params.client.replyStream(params.frame, resolveStreamId(), `WeCom WS reply failed: ${message}`, true);
      params.onFail?.(error);
    },
  };
}
