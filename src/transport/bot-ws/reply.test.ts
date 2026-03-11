import { describe, expect, it, vi, afterEach } from "vitest";

import { createBotWsReplyHandle } from "./reply.js";

type ReplyHandleParams = Parameters<typeof createBotWsReplyHandle>[0];

describe("createBotWsReplyHandle", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("uses configured placeholder content for immediate ws ack", async () => {
    const replyStream = vi.fn().mockResolvedValue(undefined);
    createBotWsReplyHandle({
      client: {
        replyStream,
      } as unknown as ReplyHandleParams["client"],
      frame: {
        headers: { req_id: "req-1" },
        body: {},
      } as unknown as ReplyHandleParams["frame"],
      accountId: "default",
      placeholderContent: "正在思考...",
    });

    expect(replyStream).toHaveBeenCalledWith(
      expect.objectContaining({
        headers: { req_id: "req-1" },
      }),
      expect.any(String),
      "正在思考...",
      false,
    );
  });

  it("keeps placeholder alive until the first real ws chunk arrives", async () => {
    vi.useFakeTimers();

    const replyStream = vi.fn().mockResolvedValue(undefined);
    const handle = createBotWsReplyHandle({
      client: {
        replyStream,
      } as unknown as ReplyHandleParams["client"],
      frame: {
        headers: { req_id: "req-keepalive" },
        body: {},
      } as unknown as ReplyHandleParams["frame"],
      accountId: "default",
      placeholderContent: "正在思考...",
    });

    await vi.advanceTimersByTimeAsync(3000);
    expect(replyStream).toHaveBeenCalledTimes(2);

    await handle.deliver({ text: "最终回复" }, { kind: "final" });
    await vi.advanceTimersByTimeAsync(6000);

    expect(replyStream).toHaveBeenCalledTimes(3);
    expect(replyStream).toHaveBeenLastCalledWith(
      expect.objectContaining({
        headers: { req_id: "req-keepalive" },
      }),
      expect.any(String),
      "最终回复",
      true,
    );
  });

  it("does not auto-send placeholder when disabled", () => {
    const replyStream = vi.fn().mockResolvedValue(undefined);
    createBotWsReplyHandle({
      client: {
        replyStream,
      } as unknown as ReplyHandleParams["client"],
      frame: {
        headers: { req_id: "req-2" },
        body: {},
      } as unknown as ReplyHandleParams["frame"],
      accountId: "default",
      autoSendPlaceholder: false,
    });

    expect(replyStream).not.toHaveBeenCalled();
  });

  it("does not retry error reply when req_id is already invalid", async () => {
    const replyStream = vi.fn().mockResolvedValue(undefined);
    const onFail = vi.fn();
    const handle = createBotWsReplyHandle({
      client: {
        replyStream,
      } as unknown as ReplyHandleParams["client"],
      frame: {
        headers: { req_id: "req-invalid" },
        body: {},
      } as unknown as ReplyHandleParams["frame"],
      accountId: "default",
      autoSendPlaceholder: false,
      onFail,
    });

    await handle.fail?.({
      headers: { req_id: "req-invalid" },
      errcode: 846605,
      errmsg: "invalid req_id",
    });

    expect(replyStream).not.toHaveBeenCalled();
    expect(onFail).toHaveBeenCalledTimes(1);
  });
});
