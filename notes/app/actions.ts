"use server";

export async function checkNote(
  formData: FormData,
): Promise<
  | { error: string }
  | { note: { title: string; body: string; tags: string[] } }
> {
  const title = formData.get("title");
  const body = formData.get("body");
  const rawTags = formData.get("tags");

  if (
    typeof title !== "string" ||
    typeof body !== "string" ||
    !title.trim() ||
    !body.trim()
  ) {
    return { error: "Title and body are required." };
  }

  const tags =
    typeof rawTags === "string"
      ? [
          ...new Set(
            rawTags
              .split(",")
              .map((tag) => tag.trim().toLowerCase())
              .filter(Boolean),
          ),
        ]
      : [];

  return {
    note: {
      title: title.trim(),
      body: body.trim(),
      tags,
    },
  };
}
