import { useEffect, useRef, useState, type ComponentProps } from "react";
import { cn } from "@/lib/utils";

export interface LazyVideoProps extends ComponentProps<"video"> {
  src: string;
  poster: string;
  idx: number;
}

export function LazyVideo({ src, poster, idx, className, ...props }: LazyVideoProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    if (!("IntersectionObserver" in window)) {
      setVisible(true);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: "150px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="aspect-[9/16] rounded-2xl overflow-hidden bg-foreground shadow-lg">
      {visible ? (
        <video
          {...props}
          src={src}
          poster={poster}
          className={cn("w-full h-full object-cover", className)}
          aria-label={`Depoimento ${idx + 1}`}
          controls
          preload="none"
          playsInline
          muted
          data-testid={`video-testimonial-${idx + 1}`}
        >
          Seu navegador não suporta vídeos.
        </video>
      ) : (
        <div className="w-full h-full flex items-center justify-center text-background/50 text-3xl" aria-hidden="true">▶</div>
      )}
    </div>
  );
}