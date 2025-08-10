import { Metadata } from "next";
import OrganizationRegisterForm from "@/components/auth/OrganizationRegisterForm";

export const metadata: Metadata = {
  title: "Register Organization",
  description: "Create a new organization account",
};

export default function OrganizationRegisterPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center bg-gray-50">
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[500px] p-8">
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Create Organization Account
          </h1>
          <p className="text-sm text-muted-foreground">
            Register your organization to get started
          </p>
        </div>
        <OrganizationRegisterForm />
      </div>
    </div>
  );
}
