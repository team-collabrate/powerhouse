import { AppleIcon } from "lucide-react";
import { buttonVariants } from "./shad-button";
import { ComingSoonButton } from "@/components/ui/ComingSoonButton";

// lucide-react dropped brand icons (trademark policy); plain inline marks,
// same idiom as the Google glyph below.
const GoogleIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12.479,14.265v-3.279h11.049c0.108,0.571,0.164,1.247,0.164,1.979c0,2.46-0.672,5.502-2.84,7.669   C18.744,22.829,16.051,24,12.483,24C5.869,24,0.308,18.613,0.308,12S5.869,0,12.483,0c3.659,0,6.265,1.436,8.223,3.307L18.392,5.62   c-1.404-1.317-3.307-2.341-5.913-2.341C7.65,3.279,3.873,7.171,3.873,12s3.777,8.721,8.606,8.721c3.132,0,4.916-1.258,6.059-2.401   c0.927-0.927,1.537-2.251,1.777-4.059L12.479,14.265z" />
  </svg>
);

const GithubIcon = (props: React.ComponentProps<"svg">) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    {...props}
  >
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.207 11.387.6.113.793-.26.793-.577 0-.285-.01-1.04-.016-2.04-3.338.725-4.043-1.61-4.043-1.61-.546-1.387-1.333-1.757-1.333-1.757-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.42-1.305.762-1.605-2.665-.303-5.467-1.333-5.467-5.93 0-1.31.469-2.381 1.236-3.221-.124-.303-.536-1.524.117-3.176 0 0 1.008-.322 3.301 1.23A11.5 11.5 0 0 1 12 5.803c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.655 1.653.243 2.874.12 3.176.77.84 1.235 1.911 1.235 3.221 0 4.61-2.807 5.624-5.48 5.921.43.372.823 1.104.823 2.226 0 1.606-.014 2.898-.014 3.293 0 .32.192.696.8.577C20.565 21.796 24 17.298 24 12c0-6.63-5.373-12-12-12z" />
  </svg>
);

/** None of these providers are wired in Supabase yet; clicking shows the
 * same "coming soon" bubble used elsewhere, not a dead/broken action. */
export function OAuthRow() {
  const cls = buttonVariants({ size: "lg", className: "w-full" });
  return (
    <div className="flex flex-col space-y-2">
      <ComingSoonButton className={cls}>
        <GoogleIcon className="me-2 size-4" />
        Continue with Google
      </ComingSoonButton>
      <ComingSoonButton className={cls}>
        <AppleIcon className="me-2 size-4" />
        Continue with Apple
      </ComingSoonButton>
      <ComingSoonButton className={cls}>
        <GithubIcon className="me-2 size-4" />
        Continue with GitHub
      </ComingSoonButton>
    </div>
  );
}

export function AuthSeparator() {
  return (
    <div className="flex w-full items-center justify-center">
      <div className="h-px w-full bg-hairline" />
      <span className="px-2 text-xs text-ink-3">OR</span>
      <div className="h-px w-full bg-hairline" />
    </div>
  );
}
