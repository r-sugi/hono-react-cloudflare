import type { Env } from "hono";

export const queue = {
	async fetch(batch: MessageBatch<unknown>, _env: Env): Promise<void> {
		for (const message of batch.messages) {
			try {
				// メッセージの処理をここに実装
				console.log("Processing message:", message.body);
				message.ack();
			} catch (error) {
				message.retry();
				console.error("Error processing message:", error);
			}
		}
	},
};
