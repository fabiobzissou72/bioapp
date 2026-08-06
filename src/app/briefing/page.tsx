import { BriefingForm } from "@/components/briefing/BriefingForm";

export const metadata = {
  title: "Briefing do seu biosite",
};

export default function BriefingPage() {
  return (
    <main className="min-h-screen w-full bg-neutral-50 px-4 pb-16 pt-8">
      <div className="mx-auto mb-6 max-w-md text-center">
        <h1 className="text-xl font-bold text-neutral-900">Vamos criar seu biosite</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Preenche esse briefing rápido com as informações do seu negócio — a gente já deixa tudo pronto pra
          você conferir.
        </p>
      </div>
      <BriefingForm />
    </main>
  );
}
