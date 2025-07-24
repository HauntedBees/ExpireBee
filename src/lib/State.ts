import { writable, type Writable } from "svelte/store";

export const TopBarTitle: Writable<string> = writable("ExpireBee");