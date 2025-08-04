import LoginForm from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Sign in to your account
        </h2>
        <LoginForm />
      </div>
    </div>
  );
}
