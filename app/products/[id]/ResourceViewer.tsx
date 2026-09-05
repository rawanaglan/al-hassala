"use client";

type ResourceViewerProps = {
  fileUrl: string;
  title: string;
};

export default function ResourceViewer({
  fileUrl,
  title,
}: ResourceViewerProps) {
  return (
    <section className="mt-16 border-t border-gray-800 pt-12">
      <h2 className="mb-6 text-2xl font-semibold">
        Read this resource
      </h2>

      <div className="overflow-hidden rounded-2xl border border-gray-800 bg-gray-950">
        <iframe
          src={fileUrl}
          title={title}
          className="h-[800px] w-full"
        />
      </div>
    </section>
  );
}