import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface WhatsAppButtonProps {
  message?: string;
}

export function WhatsAppButton({ message = "Halo, saya ingin bertanya tentang layanan Vilia Baby Spa" }: WhatsAppButtonProps) {
  const phone = "6282210400961";
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${phone}?text=${encodedMessage}`;

  return (
    <a
      href={whatsappUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50"
    >
      <Button
        size="lg"
        className="rounded-full h-14 w-14 shadow-lg shadow-primary/30 gradient-primary hover:opacity-90 transition-all hover:scale-105"
      >
        <MessageCircle className="h-6 w-6 text-primary-foreground" />
        <span className="sr-only">Chat WhatsApp</span>
      </Button>
    </a>
  );
}
