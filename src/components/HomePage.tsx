"use client";

import { Button } from "@/components/ui/button";

interface HomePageProps {
  onStart: () => void;
}

export default function HomePage({ onStart }: HomePageProps) {
  return (
    <div className="flex flex-col min-h-screen px-6 sm:px-8 lg:px-12">
      <div className="flex-1 flex items-center justify-center py-12">
        <div className="max-w-3xl w-full space-y-6 animate-fade-in">
          <div className="text-center space-y-6">
            <div className="text-center">
              <div className="inline-flex items-center gap-4">
                <h1 className="text-5xl sm:text-6xl font-light tracking-tighter">
                  Wake
                </h1>
                <img
                  src="/coffee.jpg"
                  alt="Coffee"
                  className="w-16 h-16 sm:w-20 sm:h-20 pointer-events-none object-cover rounded-full"
                />
              </div>
            </div>
            <p className="text-xl sm:text-2xl text-gray-600 font-light max-w-2xl -mt-4 mx-auto">
              A five-minute warmup for your brain to get things done
            </p>
          </div>

          <div className="flex justify-center pt-2">
            <Button onClick={onStart} size="lg" className="w-full bg-black/85 hover:bg-black rounded-2xl sm:w-auto hover:scale-[97.5%] transition-all duration-150">
              Get started
            </Button>
          </div>

        </div>
      </div>

      <footer className="text-center text-[13px] text-gray-500 pb-4">
        Built on principles of neuroscience to enhance memory activation, executive function, and mental acuity.
      </footer>
    </div>
  );
}
