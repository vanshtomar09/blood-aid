import PredictionForm from "@/components/predict-form";

export default function PredictPage() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold font-headline tracking-tight">
          AI Demand Prediction
        </h1>
        <p className="text-muted-foreground">
          Forecast future blood needs using historical data and local event analysis.
        </p>
      </div>

      <PredictionForm />
    </div>
  );
}
