import { HousingApplicationForm } from "@/components/housing-application-form";

export default function ApplicationPage() {
  return (
    <div className="container py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Apply for Housing</h1>
        <p className="text-muted-foreground mt-2">
          Complete your housing application in a few simple steps.
        </p>
      </div>
      <HousingApplicationForm />
    </div>
  );
}
