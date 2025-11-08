/**
 * Fetches the user's role from Firestore.
 * This function is designed to be called only at runtime.
 * It dynamically imports firestore-helpers to ensure it's not bundled in build-time code.
 * @param email The user's email.
 * @returns The user's role, or null if not found.
 */
export async function getUserRole(email: string): Promise<string | null> {
    const timestamp = new Date().toISOString();
    try {
        console.log(`[${timestamp}] [getUserRole] ===== START =====`);
        console.log(`[${timestamp}] [getUserRole] Fetching role for:`, email);
        
        // Dynamically import the firestore helper to ensure this runs only at runtime
        console.log(`[${timestamp}] [getUserRole] Importing firestore-helpers...`);
        const { getDocumentById } = await import('@/lib/firestore-helpers');
        
        console.log(`[${timestamp}] [getUserRole] Calling getDocumentById...`);
        const userDoc = await getDocumentById('users', email);
        console.log(`[${timestamp}] [getUserRole] User document:`, JSON.stringify(userDoc));
        
        const role = userDoc?.role || null;
        console.log(`[${timestamp}] [getUserRole] Extracted role:`, role);
        console.log(`[${timestamp}] [getUserRole] ===== END =====`);
        return role;
    } catch (error) {
        console.error(`[${timestamp}] [getUserRole] ===== ERROR =====`);
        console.error(`[${timestamp}] [getUserRole] Error fetching user role:`, error);
        console.error(`[${timestamp}] [getUserRole] Error stack:`, (error as Error).stack);
        // If there's an error (e.g., firestore not initialized at build time), return null
        return null;
    }
}
