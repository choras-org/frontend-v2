import githubIcon from "@/assets/github-icon.png";
import { Button } from "@/components/ui/button";
import { CHORAS_DOCUMENTATION_URL } from "@/constants";

export function WelcomeSidebar() {
  return (
    <div className="h-container flex flex-col">
      <div className="h-full flex flex-col justify-center items-center text-white/75 text-center text-2xl font-inter">
        <h2 className="mb-10">
          Welcome to{" "}
          <span
            className="bg-gradient-to-r from-choras-primary from-50% to-choras-secondary bg-clip-text font-choras"
            style={{ WebkitTextFillColor: "transparent" }}
          >
            CHORAS
          </span>
        </h2>
        <p className="text-xl flex flex-col leading-6">
          <span>The Community Hub for</span>
          <span>Open-source</span>
          <span>Room Acoustics Software</span>
        </p>
      </div>
      <div className="flex gap-4 p-4 border-t border-stone-600">
        <Button variant="outline" asChild>
          <a target="_blank" href={CHORAS_DOCUMENTATION_URL.github}>
            <img src={githubIcon} alt="GitHub" className="w-5 h-5" />
            <span>Repository</span>
          </a>
        </Button>
        <Button className="flex-1" asChild>
          <a target="_blank" href={CHORAS_DOCUMENTATION_URL.documentation}>
            Documentation
          </a>
        </Button>
      </div>
    </div>
  );
}
