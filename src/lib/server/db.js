import PocketBase from 'pocketbase';
import { env } from '../server/env';
import { router } from 'tinro';
export const db = new PocketBase(env.PUBLIC_POCKETBASE_HOST);
db.autoCancellation(false)
db.authStore.onChange(async (token, record) => {
    if (!token) router.goto('#/auth/login');
});
