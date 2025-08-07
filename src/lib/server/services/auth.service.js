import { db } from '../db';
import { env } from '../env';
export const Auth = {
    login: async (identity, password) => {
        return await db.collection(env.PUBLIC_USERS_COLLECTION).authWithPassword(identity, password);
    },
    refreshToken: async (collectionName) => {
        return await db.collection(collectionName).authRefresh();
    }
}