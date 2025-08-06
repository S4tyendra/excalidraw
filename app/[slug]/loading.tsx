import { Skeleton } from "@/components/ui/skeleton"

export default function Loading() {
  return (
    <div className="h-screen flex flex-col">
      {/* Header skeleton */}
      <div className="flex items-center justify-between px-4 py-2 border-b bg-background">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-6 w-32" />
        </div>
        <div className="flex items-center space-x-2">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
      </div>
    </div>
  )
}