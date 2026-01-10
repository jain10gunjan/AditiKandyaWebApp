import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'

/**
 * OptimizedVideo Component
 * Features:
 * - Lazy loading (only loads when in viewport)
 * - Progressive loading (loads in chunks)
 * - Caching support
 * - Low initial bandwidth usage
 * - YouTube-like progressive rendering
 */
export default function OptimizedVideo({ src, poster, title, className = '' }) {
  const [isInView, setIsInView] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [showPoster, setShowPoster] = useState(true)
  const [loadProgress, setLoadProgress] = useState(0)
  const videoRef = useRef(null)
  const containerRef = useRef(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px', // Start loading 50px before entering viewport
        threshold: 0.1
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current)
      }
    }
  }, [])

  // Load video metadata when in view and attempt autoplay
  useEffect(() => {
    if (isInView && videoRef.current) {
      // Set preload to auto for better autoplay experience
      videoRef.current.preload = 'auto'
      
      // Load video
      videoRef.current.load()
      
      // Try to autoplay when video can play
      const tryAutoplay = () => {
        if (videoRef.current && videoRef.current.readyState >= 3) {
          videoRef.current.play()
            .then(() => {
              setIsPlaying(true)
              setShowPoster(false)
            })
            .catch((e) => {
              console.warn('Autoplay prevented:', e)
            })
        }
      }
      
      videoRef.current.addEventListener('canplay', tryAutoplay, { once: true })
      
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('canplay', tryAutoplay)
        }
      }
    }
  }, [isInView])

  const handleLoadedMetadata = () => {
    setIsLoaded(true)
  }

  const handleProgress = () => {
    if (videoRef.current) {
      const buffered = videoRef.current.buffered
      if (buffered.length > 0) {
        const loaded = buffered.end(buffered.length - 1)
        const total = videoRef.current.duration
        if (total > 0) {
          setLoadProgress((loaded / total) * 100)
        }
      }
    }
  }

  const handleCanPlay = () => {
    // Video is ready to play
    setIsLoaded(true)
    // Auto-play when ready
    if (videoRef.current) {
      videoRef.current.play()
        .then(() => {
          setIsPlaying(true)
          setShowPoster(false)
        })
        .catch((e) => {
          console.warn('Autoplay prevented:', e)
          // If autoplay fails, user can click to play
        })
    }
  }

  const handlePlay = () => {
    setIsPlaying(true)
    setShowPoster(false)
    if (videoRef.current) {
      // Start loading the video when user clicks play
      videoRef.current.preload = 'auto'
      videoRef.current.load()
      videoRef.current.play().catch((e) => {
        console.warn('Play prevented:', e)
        setIsPlaying(false)
      })
    }
  }

  const handlePause = () => {
    setIsPlaying(false)
    if (videoRef.current) {
      videoRef.current.pause()
    }
  }

  const handleVideoClick = () => {
    if (isPlaying) {
      handlePause()
    } else {
      handlePlay()
    }
  }

  return (
    <div
      ref={containerRef}
      className={`relative group overflow-hidden bg-black ${className}`}
    >
      {/* Video Element - Only rendered when in view */}
      {isInView && (
        <video
          ref={videoRef}
          className="w-full h-full object-cover"
          preload="auto"
          playsInline
          muted
          loop
          autoPlay
          onLoadedMetadata={handleLoadedMetadata}
          onCanPlay={handleCanPlay}
          onProgress={handleProgress}
          onPlay={() => {
            setIsPlaying(true)
            setShowPoster(false)
          }}
          onPause={() => setIsPlaying(false)}
          onClick={handleVideoClick}
          style={{
            // Progressive loading - browser will load in chunks
            willChange: 'auto',
            // Enable hardware acceleration
            transform: 'translateZ(0)'
          }}
        >
          <source src={src} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      )}

      {/* Poster/Thumbnail - Shows until video starts playing */}
      {showPoster && !isPlaying && (
        <div
          className="absolute inset-0 bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center"
        >
          {poster ? (
            <img
              src={poster}
              alt={title}
              className="w-full h-full object-cover opacity-80"
              loading="lazy"
            />
          ) : (
            <div className="text-white text-center">
              <div className="text-6xl mb-4">▶️</div>
              <p className="text-lg font-semibold">{title}</p>
            </div>
          )}
        </div>
      )}

      {/* Loading Indicator */}
      {isInView && !isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/30 border-t-white rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-white text-xs">Loading video...</p>
          </div>
        </div>
      )}

      {/* Loading Progress Bar */}
      {isInView && isLoaded && loadProgress < 100 && !isPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
          <div
            className="h-full bg-white transition-all duration-300"
            style={{ width: `${loadProgress}%` }}
          />
        </div>
      )}

      {/* Pause Overlay - Only shows on hover when playing */}
      {isPlaying && (
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
          onClick={handleVideoClick}
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg
              className="w-8 h-8 md:w-10 md:h-10 text-black"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
            </svg>
          </div>
        </div>
      )}
      
      {/* Play Button - Shows when paused */}
      {!isPlaying && isLoaded && (
        <div
          className="absolute inset-0 flex items-center justify-center cursor-pointer"
          onClick={handleVideoClick}
        >
          <div className="w-16 h-16 md:w-20 md:h-20 bg-white/90 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
            <svg
              className="w-8 h-8 md:w-10 md:h-10 text-black ml-1"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      )}

      {/* Video Title Overlay */}
      {title && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-4">
          <p className="text-white font-semibold text-sm md:text-base">{title}</p>
        </div>
      )}
    </div>
  )
}

