import { useQuery } from "@tanstack/react-query";
import { hc } from "hono/client";
import type { AppType } from "~/../server";

const apiClient = hc<AppType>("/");

type Data = {
	userId: number;
	id: number;
	title: string;
	completed: boolean;
};

export function usePosts() {
	return useQuery({
		queryKey: ["data"],
		queryFn: async (): Promise<Array<Data>> => {
			const response = await apiClient.api.posts.$get();
			return response.json();
		},
	});
}
