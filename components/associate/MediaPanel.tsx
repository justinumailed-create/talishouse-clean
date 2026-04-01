export default function MediaPanel() {
  return (
    <div className="p-4 group form-container">
      <div className="relative aspect-video w-full rounded-xl bg-gray-200 overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
          <span className="text-lg">Main Product Image</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-3">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="aspect-video bg-gray-100 rounded-md group-hover:after:content-['Use_16:9_images_for_best_results'] group-hover:after:absolute group-hover:after:bottom-full group-hover:after:left-0 group-hover:after:bg-black group-hover:after:text-white group-hover:after:text-xs group-hover:after:p-1 relative cursor-pointer hover:bg-gray-200 transition-colors"
          />
        ))}
      </div>
    </div>
  );
}
