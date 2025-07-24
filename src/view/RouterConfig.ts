import type { RouterConf } from "svelte-mini-router";

export const routerConf: RouterConf = {
    routes: [
        { path: "/", render: () => import("./List.svelte") },
        { path: "/scan", render: () => import("./Barcode.svelte") },
        { path: "/products", render: () => import("./ProductManage.svelte") },
        { path: "/metadata", render: () => import("./Metadata.svelte") },
        { path: "/entry", render: () => import("./Entry.svelte") },
    ],
    baseUrl: "/expirebee",
    render404: () => import("./List.svelte"),
};