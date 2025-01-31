import { Hono } from "hono";
import {
	MethodNotAllowedError,
	NotFoundError,
	getAssetFromKV,
	serveSinglePageApp,
} from "@cloudflare/kv-asset-handler";
import { SSRRender } from "src/entry-server";
import assetManifest from "__STATIC_CONTENT_MANIFEST";
import { queue } from "./queue";
import { queue as queue2 } from "./queue2";
type Bindings = {
	__STATIC_CONTENT: KVNamespace;
	TEST_QUEUE: Queue;
	TEST_QUEUE2: Queue;
};

const app = new Hono<{ Bindings: Bindings }>();

type Data = {
	userId: number;
	id: number;
	title: string;
	completed: boolean;
};

const postsApp = new Hono<{ Bindings: Bindings }>().get("/posts", async (c) => {
	const url = "https://jsonplaceholder.typicode.com/posts";
	const response = await fetch(url);
	const result: Data[] = await response.json();
	return c.json(result);
});

const routes = app
	// .get(
	// 	"*",
	// 	cache({
	// 		cacheName: "my-app",
	// 		// cacheControl: "max-age=3600",
	// 	}),
	// )
	.route("/api", postsApp)
	.get("/assets/*", async (c) => {
		try {
			return await getAssetFromKV(
				{
					request: c.req.raw,
					waitUntil: async (p) => c.executionCtx.waitUntil(p),
				},
				{
					ASSET_NAMESPACE: c.env.__STATIC_CONTENT,
					ASSET_MANIFEST: assetManifest,
					defaultETag: "strong",
					mapRequestToAsset: serveSinglePageApp,
					cacheControl: {
						browserTTL: 0,
						edgeTTL: 0,
						bypassCache: true,
					},
				},
			);
		} catch (e) {
			if (e instanceof NotFoundError) {
				throw new Error(e.message);
			}
			if (e instanceof MethodNotAllowedError) {
				throw new Error(e.message);
			}
			throw new Error("An unexpected error occurred");
		}
	})
	.get("*", async (c) => c.newResponse(await SSRRender()))
	.notFound((c) =>
		c.json(
			{
				message: "Not Found",
				ok: false,
			},
			404,
		),
	)
	.onError((err, c) =>
		c.json(
			{
				name: err.name,
				message: err.message,
			},
			500,
		),
	);

export default {
	fetch: app.fetch,
	queue: { queue, queue2 },
};

export type AppType = typeof routes;
//
// END
//
