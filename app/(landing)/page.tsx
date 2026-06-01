import { Suspense } from "react";
import LandingForm from "./landing-form";

export default function LandingPage() {
  return (
    <Suspense>
      <LandingForm />
    </Suspense>
  );
}
