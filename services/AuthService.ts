import { createClient } from '@/lib/supabase/server';
import { User } from '@/models';

export class AuthService {
  private supabase = createClient();

  async getCurrentUser(): Promise<User | null> {
    const { data: { user }, error } = await this.supabase.auth.getUser();
    if (error || !user) return null;

    // Get user role from authorized_emails table
    const { data: authorizedEmail } = await this.supabase
      .from('authorized_emails')
      .select('role')
      .eq('email', user.email)
      .single();

    return {
      id: user.id,
      email: user.email || '',
      role: authorizedEmail?.role || 'user',
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
    };
  }

  async isAuthorized(email: string): Promise<boolean> {
    const { data, error } = await this.supabase
      .from('authorized_emails')
      .select('email')
      .eq('email', email)
      .single();

    return !error && !!data;
  }

  async getUserRole(email: string): Promise<'user' | 'manager' | 'superadmin' | null> {
    const { data, error } = await this.supabase
      .from('authorized_emails')
      .select('role')
      .eq('email', email)
      .single();

    if (error || !data) return null;
    return data.role;
  }

  async requireRole(requiredRole: 'manager' | 'superadmin'): Promise<User> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Unauthorized: Not authenticated');

    const roleHierarchy = { user: 0, manager: 1, superadmin: 2 };
    if (roleHierarchy[user.role] < roleHierarchy[requiredRole]) {
      throw new Error(`Unauthorized: Requires ${requiredRole} role`);
    }

    return user;
  }
}

