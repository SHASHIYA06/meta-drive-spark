import { MetroDashboard } from "@/components/MetroDashboard";
import { MetroBackground } from "@/components/MetroBackground";

const Index = () => {
  return (
    <div className="relative min-h-screen w-full overflow-hidden">
      <MetroBackground />
      <div className="relative z-10">
        <MetroDashboard />
      </div>
    </div>
  );
};

export default Index;
