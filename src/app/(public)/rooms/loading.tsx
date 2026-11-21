export default function RoomsLoading() {
  return (
    <main id="public-content" tabIndex={-1} className="public-rooms-page">
      {/* 1. Photographic Hero Skeleton */}
      <section className="public-page-hero" aria-label="Loading accommodations">
        <div className="public-page-hero-shade" />
        <div className="public-container public-page-hero-content text-center">
          <div className="public-skeleton w-44 h-4 mx-auto mb-4 rounded-full opacity-80" />
          <div className="public-skeleton w-3/4 max-w-lg h-12 mx-auto mb-4 rounded-lg opacity-85" />
          <div className="public-skeleton w-1/2 max-w-md h-5 mx-auto rounded opacity-75" />
        </div>
      </section>

      {/* 2. Editorial Introduction Placeholder */}
      <section className="public-rooms-intro-section" aria-hidden="true">
        <div className="public-container public-rooms-intro-grid">
          <div className="space-y-4">
            <div className="public-skeleton w-48 h-3 rounded-full" />
            <div className="public-skeleton w-4/5 h-10 rounded-lg" />
            <div className="public-skeleton w-full h-4 rounded" />
            <div className="public-skeleton w-5/6 h-4 rounded" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="public-skeleton h-24 rounded-lg" />
            <div className="public-skeleton h-24 rounded-lg" />
          </div>
        </div>
      </section>

      {/* 3. Rooms Directory Skeleton */}
      <section className="public-rooms-directory-section" aria-label="Loading accommodations list">
        <div className="public-container">
          <div className="public-rooms-directory-head mb-8">
            <div className="public-skeleton w-40 h-3 mb-3 rounded-full" />
            <div className="public-skeleton w-72 h-10 mb-3 rounded-lg" />
            <div className="public-skeleton w-96 max-w-full h-4 rounded" />
          </div>

          {/* Filter tabs skeleton */}
          <div className="flex gap-2 mb-8 overflow-hidden">
            <div className="public-skeleton w-36 h-10 rounded-full" />
            <div className="public-skeleton w-32 h-10 rounded-full" />
            <div className="public-skeleton w-24 h-10 rounded-full" />
            <div className="public-skeleton w-40 h-10 rounded-full" />
          </div>

          {/* Room Row Skeletons */}
          <div className="public-room-vertical-list space-y-8">
            {[1, 2, 3].map((idx) => (
              <div key={idx} className="public-room-row-skeleton">
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
      </section>
    </main>
  )
}
