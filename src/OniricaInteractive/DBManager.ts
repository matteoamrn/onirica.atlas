import { createClient, PostgrestError, PostgrestResponse, SupabaseClient } from "@supabase/supabase-js";

interface InsertPayload {
    data_string: string;
    created_at: string;
  }
  
  interface InsertResponse {
    data: InsertPayload[] | null;
    error: PostgrestError | null;
  }
  
  class DBManager {
    private static instance: DBManager;
    private supabase: SupabaseClient;

    private constructor() {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseAnonKey) {
            throw new Error("Supabase credentials are missing in the .env file");
        }

        this.supabase = createClient(supabaseUrl, supabaseAnonKey);
    }

    public static getInstance(): DBManager {
        if (!DBManager.instance) {
            DBManager.instance = new DBManager();
        }
        return DBManager.instance;
    }

    public getSupabase(): SupabaseClient {
        return this.supabase;
    }

    public async writeNewRow(text:string): Promise<InsertResponse> 
    {
            const { data, error }: PostgrestResponse<InsertPayload> = await this.supabase
            .from('oniricaqueryhistory')
            .insert([
              { data_string: text, created_at: new Date().toISOString() },
            ])
            .select();
        
          return { data, error };
        
    }
}

export default DBManager;
