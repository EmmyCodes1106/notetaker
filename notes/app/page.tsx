"use client";

import { useEffect, useState, type FormEvent } from "react";
import ReactMarkdown from "react-markdown";
import { checkNote } from "./actions";

type Note = {
  id: string;
  title: string;
  body: string;
  tags: string[];
};

const STORAGE_KEY = "notes";

function isNote(value: unknown): value is Note {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const note = value as Record<string, unknown>;
  return (
    typeof note.id === "string" &&
    typeof note.title === "string" &&
    typeof note.body === "string" &&
    Array.isArray(note.tags) &&
    note.tags.every((tag) => typeof tag === "string")
  );
}

export default function Home() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    queueMicrotask(() => {
      try {
        const savedNotes = window.localStorage.getItem(STORAGE_KEY);
        if (savedNotes) {
          const parsed: unknown = JSON.parse(savedNotes);
          if (!Array.isArray(parsed) || !parsed.every(isNote)) {
            throw new Error("Saved notes have an invalid format.");
          }
          setNotes(parsed);
        }
      } catch (loadError) {
        setStorageError(
          loadError instanceof Error
            ? `Saved notes could not be loaded: ${loadError.message}`
            : "Saved notes could not be loaded.",
        );
      } finally {
        setIsLoading(false);
      }
    });
  }, []);

  function saveNotes(updatedNotes: Note[]) {
    setNotes(updatedNotes);
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedNotes));
      setStorageError("");
    } catch (saveError) {
      setStorageError(
        saveError instanceof Error
          ? `Changes could not be saved: ${saveError.message}`
          : "Changes could not be saved.",
      );
    }
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    setIsSubmitting(true);
    try {
      const result = await checkNote(new FormData(form));

      if ("error" in result) {
        setError(result.error);
        return;
      }

      saveNotes([
        { ...result.note, id: window.crypto.randomUUID() },
        ...notes,
      ]);
      setError("");
      form.reset();
    } finally {
      setIsSubmitting(false);
    }
  }

  const availableTags = [...new Set(notes.flatMap((note) => note.tags))].sort();
  const normalizedSearch = search.trim().toLowerCase();
  const visibleNotes = notes.filter((note) => {
    const matchesTag = selectedTag === null || note.tags.includes(selectedTag);
    const matchesSearch =
      !normalizedSearch ||
      note.title.toLowerCase().includes(normalizedSearch) ||
      note.body.toLowerCase().includes(normalizedSearch);
    return matchesTag && matchesSearch;
  });

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-4 py-8 text-slate-100 sm:gap-10 sm:px-6 sm:py-12">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Notes
        </h1>
        <p className="text-slate-400">A quiet space for your thoughts.</p>
      </header>

      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-5 rounded-2xl border border-slate-700/80 bg-slate-900/70 p-4 shadow-xl shadow-black/20 backdrop-blur sm:p-6"
      >
        <div className="flex flex-col gap-2">
          <label htmlFor="title" className="font-medium text-slate-200">
            Title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="body" className="font-medium text-slate-200">
            Body
          </label>
          <textarea
            id="body"
            name="body"
            rows={5}
            className="w-full resize-y rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          />
          <p className="text-sm text-slate-400">
            Markdown supported: headings, bold text, and lists.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="tags" className="font-medium text-slate-200">
            Tags
          </label>
          <input
            id="tags"
            name="tags"
            type="text"
            placeholder="work, ideas, personal"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          />
          <p className="text-sm text-slate-400">Separate tags with commas.</p>
        </div>

        {error && (
          <p role="alert" className="text-sm text-rose-300">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting || isLoading}
          className="min-h-11 w-full rounded-lg bg-sky-400 px-5 py-2.5 font-semibold text-slate-950 shadow-lg shadow-sky-950/30 transition hover:bg-sky-300 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
        >
          {isSubmitting ? "Saving..." : "Save note"}
        </button>
      </form>

      {storageError && (
        <p role="alert" className="text-sm text-rose-300">
          {storageError}
        </p>
      )}

      {isLoading ? (
        <p className="text-slate-400" role="status">
          Loading notes...
        </p>
      ) : notes.length > 0 ? (
        <section
          aria-labelledby="saved-notes-heading"
          className="flex flex-col gap-4"
        >
          <h2
            id="saved-notes-heading"
            className="text-xl font-semibold text-slate-100"
          >
            Saved notes
          </h2>

          <label htmlFor="search" className="font-medium text-slate-200">
            Search notes
          </label>
          <input
            id="search"
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search titles and note bodies"
            className="w-full rounded-lg border border-slate-700 bg-slate-950/70 px-3 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
          />

          <div className="flex flex-wrap gap-2" aria-label="Filter by tag">
            <button
              type="button"
              onClick={() => setSelectedTag(null)}
              aria-pressed={selectedTag === null}
              className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium ${
                selectedTag === null
                  ? "bg-sky-400 text-slate-950"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700"
              }`}
            >
              All
            </button>
            {availableTags.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() =>
                  setSelectedTag((currentTag) =>
                    currentTag === tag ? null : tag,
                  )
                }
                aria-pressed={selectedTag === tag}
                className={`min-h-10 rounded-full px-4 py-2 text-sm font-medium ${
                  selectedTag === tag
                    ? "bg-sky-400 text-slate-950"
                    : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {visibleNotes.length === 0 ? (
            <p className="py-4 text-slate-400" role="status">
              No notes match your search or selected tag.
            </p>
          ) : (
            <ul className="flex flex-col gap-4">
              {visibleNotes.map((note) => (
                <li
                  key={note.id}
                  className="min-w-0 space-y-4 rounded-2xl border border-slate-700/80 border-l-4 border-l-sky-400 bg-gradient-to-br from-slate-900 to-slate-900/70 p-4 shadow-lg shadow-black/20 sm:p-5"
                >
                  <h3 className="min-w-0 break-words text-xl font-semibold tracking-tight text-slate-50">
                    {note.title}
                  </h3>
                  <div className="min-w-0 break-words rounded-xl border border-slate-800/80 bg-slate-950/40 px-4 py-3 text-[15px] leading-7 text-slate-300 [&_a]:text-sky-300 [&_a]:underline [&_blockquote]:my-3 [&_blockquote]:border-l-2 [&_blockquote]:border-sky-500 [&_blockquote]:pl-4 [&_h1]:my-3 [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-slate-100 [&_h2]:my-3 [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-slate-100 [&_h3]:my-2 [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-slate-100 [&_ol]:my-2 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_strong]:font-semibold [&_strong]:text-slate-100 [&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6">
                    <ReactMarkdown>{note.body}</ReactMarkdown>
                  </div>
                  {note.tags.length > 0 && (
                    <ul aria-label="Tags" className="flex flex-wrap gap-2">
                      {note.tags.map((tag) => (
                        <li key={tag}>
                          <button
                            type="button"
                            onClick={() => setSelectedTag(tag)}
                            aria-pressed={selectedTag === tag}
                            className="min-h-9 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm font-medium text-sky-200 transition hover:border-sky-300/50 hover:bg-sky-400/20"
                          >
                            {tag}
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <p className="text-slate-400">No notes yet. Add one above.</p>
      )}
    </main>
  );
}