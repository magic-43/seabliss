export default function RoomsSkeleton() {
  return (
    <div className="public-rooms-directory-container" aria-busy="true" aria-label="Loading accommodations">
      {/* Category Filter Tabs Skeleton */}
      <div className="public-rooms-tabs" aria-hidden="true">
        <div className="public-skeleton w-36 h-10 rounded-full" />
        <div className="public-skeleton w-32 h-10 rounded-full" />
        <div className="public-skeleton w-24 h-10 rounded-full" />
        <div className="public-skeleton w-40 h-10 rounded-full" />
      </div>

      {/* Room Row Cards Skeleton */}
      <div className="public-room-directory">
        <div className="public-room-vertical-list space-y-8">
          {[1, 2, 3].map((id) => (
            <div key={id} className="public-room-row-skeleton" aria-hidden="true">
              <div className="public-skeleton public-skeleton-media" />
              <div className="public-skeleton-body">
                <div className="space-y-4">
                  <div className="public-skeleton w-32 h-3 rounded-full" />
                  <div className="public-skeleton w-3/5 h-8 rounded-lg" />
                  <div className="public-skeleton w-full h-4 rounded" />
                  <div className="public-skeleton w-4/5 h-4 rounded" />

                  <div className="flex gap-4 pt-2">
                    <div className="public-skeleton w-32 h-5 rounded" />
                    <div className="public-skeleton w-28 h-5 rounded" />
                    <div className="public-skeleton w-20 h-5 rounded" />
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2">
                    <div className="public-skeleton w-24 h-7 rounded-full" />
                    <div className="public-skeleton w-28 h-7 rounded-full" />
                    <div className="public-skeleton w-24 h-7 rounded-full" />
                    <div className="public-skeleton w-32 h-7 rounded-full" />
                  </div>
                </div>

                <div className="pt-8 border-t border-[#ded5c6]/50 flex flex-wrap items-center justify-between gap-4 mt-6">
                  <div>
                    <div className="public-skeleton w-12 h-3 mb-1.5 rounded" />
                    <div className="public-skeleton w-32 h-8 rounded" />
                  </div>
                  <div className="flex gap-3">
                    <div className="public-skeleton w-28 h-11 rounded-lg" />
                    <div className="public-skeleton w-32 h-11 rounded-lg" />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
