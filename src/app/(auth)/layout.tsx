import type { Metadata } from "next";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

/**
 * Route group: `(auth)` не попадает в URL.
 * Общая колонка для `/login` и `/register` — без хедера приложения.
 * `LayoutProps<"/">`: у группы нет сегмента пути, typegen относит layout к `/`.
 */
export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}
