import PocketBase from 'pocketbase';
// @ts-ignore
import { env } from '$lib/server/env.js';

export const pb = new PocketBase(env.PUBLIC_POCKETBASE_HOST);
pb.autoCancellation(false);
pb.authStore.loadFromCookie(document.cookie);
pb.authStore.onChange((token) => {
    document.cookie = pb.authStore.exportToCookie({ httpOnly: false });
});