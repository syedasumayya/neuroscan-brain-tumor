import AuthShell from "@/components/AuthShell";
import AuthForm from "@/components/AuthForm";

export const metadata = { title: "Create account - NeuroScan" };

export default function RegisterPage() {
  return (
    <AuthShell>
      <AuthForm mode="register" />
    </AuthShell>
  );
}