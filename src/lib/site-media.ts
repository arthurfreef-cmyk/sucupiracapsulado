import hero from "@/assets/optimized/hero.webp.asset.json";
import heroMobile from "@/assets/optimized/hero-mobile.webp.asset.json";
import mulher from "@/assets/optimized/mulher.webp.asset.json";
import sucupira from "@/assets/optimized/sucupira.webp.asset.json";
import canela from "@/assets/optimized/canela.webp.asset.json";
import calcio from "@/assets/optimized/calcio.webp.asset.json";
import anvisa from "@/assets/optimized/anvisa.webp.asset.json";
import kit1 from "@/assets/optimized/kit1.webp.asset.json";
import kit3 from "@/assets/optimized/kit3.webp.asset.json";
import kit5 from "@/assets/optimized/kit5.webp.asset.json";
import dep1 from "@/assets/optimized/dep1.webp.asset.json";
import dep2 from "@/assets/optimized/dep2.webp.asset.json";
import dep3 from "@/assets/optimized/dep3.webp.asset.json";
import dep4 from "@/assets/optimized/dep4.webp.asset.json";
import dep5 from "@/assets/optimized/dep5.webp.asset.json";
import dep6 from "@/assets/optimized/dep6.webp.asset.json";
import dep7 from "@/assets/optimized/dep7.webp.asset.json";
import video1 from "@/assets/optimized/testimonial-1.mp4.asset.json";
import video2 from "@/assets/optimized/testimonial-2.mp4.asset.json";
import video3 from "@/assets/optimized/testimonial-3.mp4.asset.json";
import video4 from "@/assets/optimized/testimonial-4.mp4.asset.json";
import video5 from "@/assets/optimized/testimonial-5.mp4.asset.json";
import video6 from "@/assets/optimized/testimonial-6.mp4.asset.json";
import video7 from "@/assets/optimized/testimonial-7.mp4.asset.json";
import poster1 from "@/assets/optimized/testimonial-1.webp.asset.json";
import poster2 from "@/assets/optimized/testimonial-2.webp.asset.json";
import poster3 from "@/assets/optimized/testimonial-3.webp.asset.json";
import poster4 from "@/assets/optimized/testimonial-4.webp.asset.json";
import poster5 from "@/assets/optimized/testimonial-5.webp.asset.json";
import poster6 from "@/assets/optimized/testimonial-6.webp.asset.json";
import poster7 from "@/assets/optimized/testimonial-7.webp.asset.json";

export const siteImages = {
  hero: hero.url, mulher: mulher.url, sucupira: sucupira.url,
  canela: canela.url, calcio: calcio.url, anvisa: anvisa.url,
  kit1: kit1.url, kit3: kit3.url, kit5: kit5.url,
  dep1: dep1.url, dep2: dep2.url, dep3: dep3.url, dep4: dep4.url,
  dep5: dep5.url, dep6: dep6.url, dep7: dep7.url,
};
export const heroSrcSet = `${heroMobile.url} 320w, ${hero.url} 896w`;
export const heroSizes = "(max-width: 639px) 280px, 448px";
export const testimonialVideos = [
  { src: video1.url, poster: poster1.url },
  { src: video2.url, poster: poster2.url },
  { src: video3.url, poster: poster3.url },
  { src: video4.url, poster: poster4.url },
  { src: video5.url, poster: poster5.url },
  { src: video6.url, poster: poster6.url },
  { src: video7.url, poster: poster7.url },
];