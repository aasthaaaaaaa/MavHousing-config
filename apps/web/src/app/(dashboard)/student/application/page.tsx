import { HousingApplicationForm } from "@/components/housing-application-form";

export default function ApplicationPage() {
  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <div className="animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both">
        <h1 className="text-3xl font-bold tracking-tight">Apply for Housing</h1>
        <p className="text-muted-foreground mt-1">
          Complete your housing application in a few simple steps.
        </p>
      </div>
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-600 fill-mode-both" style={{ animationDelay: "80ms" }}>
        <HousingApplicationForm />
      </div>
    </div>
  );
}
