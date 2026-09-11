import { createAdminClient } from "@/lib/supabase/admin";

export const LOGO_BUCKET = "agency-logos";
export const LOGO_MAX_BYTES = 2 * 1024 * 1024; // 2MB
export const LOGO_MIME_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
] as const;

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

async function ensureLogoBucket(
  admin: NonNullable<ReturnType<typeof createAdminClient>>,
) {
  const { data } = await admin.storage.getBucket(LOGO_BUCKET);
  if (data) return;
  await admin.storage.createBucket(LOGO_BUCKET, {
    public: true,
    fileSizeLimit: LOGO_MAX_BYTES,
    allowedMimeTypes: [...LOGO_MIME_TYPES],
  });
}

export interface UploadResult {
  url: string;
}

/**
 * Upload (or replace) an agency's logo. Fixed path per agency + a
 * cache-busting query string on the returned URL, so the sidebar/portal
 * picks up the new image immediately instead of serving a stale CDN copy.
 */
export async function uploadAgencyLogo(
  agencyId: string,
  file: File,
): Promise<UploadResult> {
  const admin = createAdminClient();
  if (!admin) throw new Error("Storage is not configured");
  await ensureLogoBucket(admin);

  const ext = EXT_BY_MIME[file.type] ?? "bin";
  const path = `${agencyId}/logo.${ext}`;
  const bytes = new Uint8Array(await file.arrayBuffer());

  const { error } = await admin.storage
    .from(LOGO_BUCKET)
    .upload(path, bytes, { contentType: file.type, upsert: true });
  if (error) throw error;

  const { data } = admin.storage.from(LOGO_BUCKET).getPublicUrl(path);
  return { url: `${data.publicUrl}?v=${Date.now()}` };
}

/** Best-effort: clears the record even if the storage delete fails. */
export async function deleteAgencyLogo(agencyId: string): Promise<void> {
  const admin = createAdminClient();
  if (!admin) return;
  try {
    const { data } = await admin.storage.from(LOGO_BUCKET).list(agencyId);
    if (data?.length) {
      await admin.storage
        .from(LOGO_BUCKET)
        .remove(data.map((f) => `${agencyId}/${f.name}`));
    }
  } catch {
    // storage cleanup is best-effort; the DB column is the source of truth
  }
}
