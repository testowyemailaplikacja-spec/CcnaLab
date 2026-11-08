/* CCNAlab standalone: intentionally no Supabase SDK. 
 * Remote authentication and cloud data require the original Wiedora host provider;
 * never reuse production credentials in the public development build.
 * This keeps the existing wrapper's script reference resolvable without impersonating authentication.
 */
