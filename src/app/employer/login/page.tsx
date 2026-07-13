import { RoleLoginForm } from "@/components/RoleLoginForm";

export default function EmployerLoginPage() {
  return <RoleLoginForm role="employer" roleLabel="employer" dashboardHref="/employer/dashboard" loginHref="/employer/login" />;
}
