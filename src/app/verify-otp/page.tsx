
import { VerifyOtpForm } from "@/components/auth/verify-otp-form";
import { Suspense } from "react";

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
