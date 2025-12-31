import { json, error, type RequestEvent } from '@sveltejs/kit';
import { auth } from '$lib/auth';
import { deleteTemporaryConversations } from '$lib/db/queries';

// POST - cleanup temporary conversations from previous sessions
export async function POST({ request }: RequestEvent) {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
        throw error(401, 'Unauthorized');
    }

    try {
        await deleteTemporaryConversations(session.user.id);
        return json({ ok: true });
    } catch (e) {
        console.error('Failed to cleanup temporary conversations:', e);
        return json({ ok: false, error: String(e) });
    }
};
