function getLessonFromCourse(course, mIdx, lIdx, cIdx = null) {
  const mi = Number(mIdx)
  const li = Number(lIdx)

  if (cIdx !== null) {
    const ci = Number(cIdx)
    if (course.chapters && course.chapters[ci]) {
      const chapter = course.chapters[ci]
      if (chapter.modules && chapter.modules[mi]) {
        const module = chapter.modules[mi]
        if (module.lessons && module.lessons[li]) {
          return module.lessons[li]
        }
      }
    }
    return null
  }

  if (course.modules && Array.isArray(course.modules) && course.modules.length > 0) {
    if (course.modules[mi]) {
      const module = course.modules[mi]
      if (module.lessons && Array.isArray(module.lessons) && module.lessons[li]) {
        return module.lessons[li]
      }
    }
  }

  if (course.chapters && Array.isArray(course.chapters) && course.chapters.length > 0) {
    const chapter = course.chapters[0]
    if (chapter && chapter.modules && Array.isArray(chapter.modules) && chapter.modules[mi]) {
      const module = chapter.modules[mi]
      if (module.lessons && Array.isArray(module.lessons) && module.lessons[li]) {
        return module.lessons[li]
      }
    }
  }

  return null
}

module.exports = { getLessonFromCourse }
