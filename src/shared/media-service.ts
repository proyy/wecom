import type { PluginRuntime } from "openclaw/plugin-sdk";

import type { NormalizedMediaAttachment } from "./media-types.js";
import type { UnifiedInboundEvent } from "../types/index.js";

export class WecomMediaService {
  constructor(private readonly core: PluginRuntime) {}

  async downloadRemoteMedia(params: { url: string }): Promise<NormalizedMediaAttachment> {
    const loaded = await this.core.channel.media.fetchRemoteMedia({ url: params.url });
    return {
      buffer: loaded.buffer,
      contentType: loaded.contentType,
      filename: loaded.fileName,
    };
  }

  async saveInboundAttachment(event: UnifiedInboundEvent, attachment: NormalizedMediaAttachment): Promise<string> {
    const saved = await this.core.channel.media.saveMediaBuffer(
      attachment.buffer,
      attachment.contentType,
      "inbound",
      undefined,
      attachment.filename,
    );
    return saved.path;
  }

  async normalizeFirstAttachment(event: UnifiedInboundEvent): Promise<NormalizedMediaAttachment | undefined> {
    const first = event.attachments?.[0];
    if (!first?.remoteUrl) {
      return undefined;
    }
    return this.downloadRemoteMedia({ url: first.remoteUrl });
  }
}
