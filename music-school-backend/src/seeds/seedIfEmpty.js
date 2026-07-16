const { Course, Teacher } = require('../models')

async function seedIfEmpty() {
  try {
    const courseCount = await Course.countDocuments()
    const teacherCount = await Teacher.countDocuments()
    if (courseCount === 0) {
      await Course.insertMany([
        {
          title: 'Guitar Basics',
          description: 'Beginner-friendly chords and rhythms',
          price: 2999,
          image: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=600&auto=format&fit=crop',
          level: 'Beginner',
        },
        {
          title: 'Piano Pro',
          description: 'Scales, arpeggios, and performance tips',
          price: 3499,
          image: 'https://images.unsplash.com/photo-1513883049090-d0b7439799bf?q=80&w=600&auto=format&fit=crop',
          level: 'Intermediate',
        },
        {
          title: 'Vocal Coaching',
          description: 'Breathing, pitch, and performance practice',
          price: 2799,
          image: 'https://images.unsplash.com/photo-1483412033650-1015ddeb83d1?q=80&w=600&auto=format&fit=crop',
          level: 'All Levels',
        },
      ])
      console.log('Seeded demo courses')
    }
    if (teacherCount === 0) {
      await Teacher.insertMany([
        { name: 'Aarav', instrument: 'Guitar', avatar: 'https://i.pravatar.cc/150?img=12' },
        { name: 'Maya', instrument: 'Piano', avatar: 'https://i.pravatar.cc/150?img=32' },
        { name: 'Kabir', instrument: 'Vocals', avatar: 'https://i.pravatar.cc/150?img=22' },
      ])
      console.log('Seeded demo teachers')
    }
  } catch (e) {
    console.warn('Seeding skipped:', e?.message)
  }
}

module.exports = { seedIfEmpty }
