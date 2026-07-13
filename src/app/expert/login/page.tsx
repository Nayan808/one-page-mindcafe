import { RoleLoginForm } from "@/components/RoleLoginForm";

export default function ExpertLoginPage() {
  return <RoleLoginForm role="expert" roleLabel="expert" dashboardHref="/expert/dashboard" loginHref="/expert/login" />;
}
