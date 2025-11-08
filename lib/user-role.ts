/**
 * Fetches the user's role from Firestore.
 * This function is designed to be called only at runtime.
 * It dynamically imports firestore-helpers to ensure it's not bundled in build-time code.
 * @param email The user's email.
 * @returns The user's role, or null if not found.
 */
export async function getUserRole(email: string): Promise<string | null> {
    try {
        console.log('[getUserRole] Fetching role for:', email);
        // Dynamically import the firestore helper to ensure this runs only at runtime
        const { getDocumentById } = await import('@/lib/firestore-helpers');
        const userDoc = await getDocumentById('users', email);
        console.log('[getUserRole] User document:', userDoc);
        const role = userDoc?.role || null;
        console.log('[getUserRole] Returning role:', role);
        return role;
    } catch (error) {
        console.error("[getUserRole] Error fetching user role:", error);
        // If there's an error (e.g., firestore not initialized at build time), return null
        return null;
    }
}
