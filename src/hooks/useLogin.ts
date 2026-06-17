import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/lib/supabase";

const loginSchema = z.object({
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(1, "Password wajib diisi"),
});

export type LoginFormValues = z.infer<typeof loginSchema>;

const ROLE_PATHS: Record<string, string> = {
  salesman: "/salesman/dashboard",
  supervisor: "/supervisor/dashboard",
  admin_sales: "/admin-sales/dashboard",
  admin_claim: "/admin-claim/dashboard",
  apoteker: "/apoteker/dashboard",
};

export function useLogin() {
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setError("");
    setLoading(true);

    // Step 1: Sign in
    const { data: authData, error: authError } =
      await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      });

    if (authError || !authData.user) {
      setError("Email atau password salah");
      setLoading(false);
      return;
    }

    // Step 2: Get role from users table (session is already set, this is the only extra call needed)
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("role")
      .eq("id", authData.user.id)
      .limit(1)
      .maybeSingle();

    if (userError || !userData) {
      setError("Gagal memuat data user. Hubungi administrator.");
      setLoading(false);
      return;
    }

    const path = ROLE_PATHS[userData.role];

    if (!path) {
      setError(`Role tidak dikenal: ${userData.role}`);
      setLoading(false);
      return;
    }

    // Direct redirect — no intermediate /redirect page needed
    router.replace(path);
  };

  return {
    form,
    error,
    loading,
    onSubmit: form.handleSubmit(onSubmit),
  };
}
