import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LegalHeader from "./LegalHeader";
import MediaPanel from "./MediaPanel";
import CTASection from "./CTASection";

interface AssociateViewProps {
  fastCode: string;
}

export default function AssociateView({ fastCode }: AssociateViewProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <LegalHeader />

      <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] h-full flex-1">
        <MediaPanel />
        
        <CTASection fastCode={fastCode} />
      </div>

      <Footer />
    </div>
  );
}
