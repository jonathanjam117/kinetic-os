import { createClient, SupabaseClient } from '@supabase/supabase-js';

let cachedClient: SupabaseClient | null = null;
let cachedUrl = '';
let cachedKey = '';

export function getSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const activeUrl =
    url ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
    '';
  const activeKey =
    anonKey ||
    (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
    '';

  if (!activeUrl || !activeKey) {
    return null;
  }

  if (cachedClient && cachedUrl === activeUrl && cachedKey === activeKey) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(activeUrl, activeKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    cachedUrl = activeUrl;
    cachedKey = activeKey;
    return cachedClient;
  } catch (err) {
    console.error('[KINETIC // SUPABASE] Error instantiating client:', err);
    return null;
  }
}

export async function testSupabaseConnection(
  url?: string,
  anonKey?: string
): Promise<{ success: boolean; message: string }> {
  const client = getSupabaseClient(url, anonKey);
  if (!client) {
    return {
      success: false,
      message: 'Faltan SUPABASE_URL o SUPABASE_ANON_KEY válidos.',
    };
  }

  try {
    // Attempt lightweight query to check connection
    const { error } = await client.from('user_biometrics').select('id').limit(1);

    if (error) {
      // If table doesn't exist yet, but authentication reached Supabase
      if (error.code === '42P01' || error.message?.includes('does not exist')) {
        return {
          success: true,
          message: 'Conexión a Supabase exitosa (requiere ejecutar schema.sql en SQL Editor).',
        };
      }
      return {
        success: false,
        message: `Error de respuesta Supabase: ${error.message} (Código ${error.code})`,
      };
    }

    return {
      success: true,
      message: 'Conexión con Supabase y PostgreSQL verificada exitosamente.',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    return {
      success: false,
      message: `Fallo de red o URL inalcanzable: ${errorMsg}`,
    };
  }
}
