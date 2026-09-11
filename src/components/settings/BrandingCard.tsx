"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Upload, X } from "react-feather";
import { Card, CardHeader } from "@/components/dashboard/Card";
import { normalizeHex, DEFAULT_ACCENT } from "@/lib/color";

const ACCEPT = "image/png,image/jpeg,image/webp,image/svg+xml";
const MAX_BYTES = 2 * 1024 * 1024;

export function BrandingCard({
  name,
  logoUrl,
  brandColor,
}: {
  name: string;
  logoUrl: string | null;
  brandColor: string;
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [logoError, setLogoError] = useState<string | null>(null);

  const [color, setColor] = useState(normalizeHex(brandColor) ?? DEFAULT_ACCENT);
  const [colorStatus, setColorStatus] = useState<"idle" | "saving" | "saved">(
    "idle",
  );
  const [colorError, setColorError] = useState<string | null>(null);

  async function saveColor(next: string) {
    setColorStatus("saving");
    setColorError(null);
    const res = await fetch("/api/settings", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brandColor: next }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setColorStatus("idle");
      setColorError(json.error?.message ?? "Could not save the colour");
      return;
    }
    setColorStatus("saved");
    router.refresh();
  }

  function onColorChange(v: string) {
    setColor(v);
  }

  async function onUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setLogoError(null);
    if (file.size > MAX_BYTES) {
      setLogoError("Max file size is 2MB");
      return;
    }
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await fetch("/api/settings/logo", { method: "POST", body: fd });
    setUploading(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      setLogoError(json.error?.message ?? "Upload failed");
      return;
    }
    router.refresh();
  }

  async function removeLogo() {
    setUploading(true);
    await fetch("/api/settings/logo", { method: "DELETE" });
    setUploading(false);
    router.refresh();
  }

  return (
    <Card>
      <CardHeader
        title="Branding"
        subtitle="Your logo and colour replace Powerhouse's own branding throughout the app"
        menu={false}
      />
      <div className="grid gap-5 px-5 pb-5 pt-2 sm:grid-cols-2">
        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink">
            Logo
          </span>
          <div className="flex items-center gap-3">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element -- external, agency-supplied URL
              <img
                src={logoUrl}
                alt=""
                className="h-14 w-14 shrink-0 rounded-[var(--radius-sm)] border border-hairline object-cover"
              />
            ) : (
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-[var(--radius-sm)] border border-hairline bg-surface-sunken text-[20px] font-bold text-ink-3">
                {name.charAt(0).toUpperCase() || "?"}
              </span>
            )}
            <div className="flex flex-col gap-1.5">
              <button
                type="button"
                disabled={uploading}
                onClick={() => fileRef.current?.click()}
                className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-2.5 text-[12.5px] font-medium text-ink hover:bg-surface-sunken disabled:opacity-50"
              >
                <Upload size={13} />
                {uploading ? "Uploading…" : logoUrl ? "Replace" : "Upload logo"}
              </button>
              {logoUrl && (
                <button
                  type="button"
                  disabled={uploading}
                  onClick={removeLogo}
                  className="inline-flex h-8 items-center gap-1 text-[12px] font-medium text-ink-3 hover:text-loss disabled:opacity-50"
                >
                  <X size={12} />
                  Remove
                </button>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={onUpload}
            />
          </div>
          {logoError && (
            <p className="mt-1.5 text-[12px] text-loss">{logoError}</p>
          )}
          <p className="mt-1.5 text-[12px] text-ink-3">
            PNG, JPG, WEBP, or SVG. Up to 2MB.
          </p>
        </div>

        <div>
          <span className="mb-1.5 block text-[13px] font-medium text-ink">
            Accent colour
          </span>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              onBlur={() => saveColor(color)}
              className="h-10 w-12 cursor-pointer rounded-[var(--radius-sm)] border border-hairline-strong bg-surface p-1"
            />
            <input
              value={color}
              onChange={(e) => onColorChange(e.target.value)}
              onBlur={() => {
                const n = normalizeHex(color);
                if (n) saveColor(n);
                else setColor(normalizeHex(brandColor) ?? DEFAULT_ACCENT);
              }}
              className="h-10 w-full rounded-[var(--radius-sm)] border border-hairline-strong bg-surface px-3 font-mono text-[13px] outline-none focus:border-accent"
            />
          </div>
          {colorError && (
            <p className="mt-1.5 text-[12px] text-loss">{colorError}</p>
          )}
          {colorStatus === "saved" && (
            <p className="mt-1.5 text-[12px] text-profit">Saved</p>
          )}
          <p className="mt-1.5 text-[12px] text-ink-3">
            Drag the slider in the swatch, or paste any hex; buttons and
            highlights across the whole app pick it up.
          </p>
        </div>
      </div>
    </Card>
  );
}
