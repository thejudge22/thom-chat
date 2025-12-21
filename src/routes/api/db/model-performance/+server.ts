import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { auth } from '$lib/auth';
import {
    getModelPerformanceStatsByUser,
    calculateAllModelPerformanceStats,
} from '$lib/db/queries/model-performance';

async function getSessionUserId(request: Request): Promise<string> {
    const session = await auth.api.getSession({ headers: request.headers });
    if (!session?.user?.id) {
        throw error(401, 'Unauthorized');
    }
    return session.user.id;
}

export const GET: RequestHandler = async ({ request, url }) => {
    try {
        const userId = await getSessionUserId(request);
        const recalculate = url.searchParams.get('recalculate') === 'true';

        console.log(`[model-performance] Fetching stats for user ${userId} (recalculate: ${recalculate})`);

        let stats;
        if (recalculate) {
            // Recalculate all stats from scratch
            console.log(`[model-performance] Recalculating all stats for user ${userId}`);
            stats = await calculateAllModelPerformanceStats(userId);
            console.log(`[model-performance] Recalculated ${stats.length} model stats`);
        } else {
            // Just fetch existing stats
            stats = await getModelPerformanceStatsByUser(userId);
            console.log(`[model-performance] Retrieved ${stats.length} cached stats`);
        }

        return json({ success: true, stats });
    } catch (err) {
        console.error('[model-performance] Error fetching stats:', err);
        if (err && typeof err === 'object' && 'status' in err) {
            throw err; // Re-throw SvelteKit errors
        }
        throw error(500, 'Failed to fetch model performance stats');
    }
};
