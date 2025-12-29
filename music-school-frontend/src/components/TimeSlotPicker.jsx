import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

/**
 * TimeSlotPicker Component
 * Displays time slots in a grid and disables/grays out booked slots
 */
export default function TimeSlotPicker({ 
  selectedDate, 
  startTime, 
  endTime, 
  onStartTimeChange, 
  onEndTimeChange, 
  bookedSlots = [],
  intervalMinutes = 30,
  startHour = 8,
  endHour = 22
}) {
  const [hoveredSlot, setHoveredSlot] = useState(null)

  // Generate time slots
  const generateTimeSlots = () => {
    const slots = []
    const totalMinutes = (endHour - startHour) * 60
    const numSlots = Math.floor(totalMinutes / intervalMinutes)
    
    for (let i = 0; i < numSlots; i++) {
      const minutes = startHour * 60 + (i * intervalMinutes)
      const hours = Math.floor(minutes / 60)
      const mins = minutes % 60
      const timeString = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
      slots.push(timeString)
    }
    
    return slots
  }

  const timeSlots = generateTimeSlots()

  // Helper: Convert time string (HH:MM) to minutes since midnight
  const timeToMinutes = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number)
    return hours * 60 + minutes
  }
  
  // Helper: Extract time from Date object and convert to minutes
  const dateToMinutes = (date) => {
    return date.getHours() * 60 + date.getMinutes()
  }
  
  // Check if a time slot is booked (any part of the slot overlaps with a booking)
  const isSlotBooked = (slotTime) => {
    if (!bookedSlots || bookedSlots.length === 0) return false
    
    const slotStartMinutes = timeToMinutes(slotTime)
    const slotEndMinutes = slotStartMinutes + intervalMinutes
    
    return bookedSlots.some(booking => {
      try {
        const bookingStart = new Date(booking.startTime)
        const bookingEnd = new Date(booking.endTime)
        
        // Check if booking is on the selected date
        const bookingDateStr = bookingStart.toISOString().split('T')[0]
        if (bookingDateStr !== selectedDate) {
          return false // Booking is on a different date
        }
        
        // Extract time in minutes from booking
        const bookingStartMinutes = dateToMinutes(bookingStart)
        const bookingEndMinutes = dateToMinutes(bookingEnd)
        
        // Check overlap: two intervals overlap if start1 < end2 AND start2 < end1
        const overlaps = slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes
        
        // Also block if slot starts exactly when booking ends (teacher occupied until then)
        const startsAtBookingEnd = slotStartMinutes === bookingEndMinutes
        
        return overlaps || startsAtBookingEnd
      } catch (e) {
        console.warn('Error checking slot booking:', e, booking)
        return false
      }
    })
  }

  // Check if a time range (from startTime to endTime) conflicts with any booking
  const doesRangeConflict = (rangeStartTime, rangeEndTime) => {
    if (!rangeStartTime || !rangeEndTime || !bookedSlots || bookedSlots.length === 0) return false
    
    const rangeStart = new Date(`${selectedDate}T${rangeStartTime}:00`)
    const rangeEnd = new Date(`${selectedDate}T${rangeEndTime}:00`)
    
    // Ensure rangeEnd is after rangeStart
    if (rangeEnd <= rangeStart) return false
    
    return bookedSlots.some(booking => {
      const bookingStart = new Date(booking.startTime)
      const bookingEnd = new Date(booking.endTime)
      
      // Check if the selected range overlaps with booking
      // Overlap occurs when: rangeStart < bookingEnd AND rangeEnd > bookingStart
      return (rangeStart < bookingEnd && rangeEnd > bookingStart)
    })
  }

  // Get booking info for a slot
  const getBookingInfo = (slotTime) => {
    if (!bookedSlots || bookedSlots.length === 0) return null
    
    const slotStartMinutes = timeToMinutes(slotTime)
    const slotEndMinutes = slotStartMinutes + intervalMinutes
    
    const booking = bookedSlots.find(b => {
      try {
        const bookingStart = new Date(b.startTime)
        const bookingEnd = new Date(b.endTime)
        
        const bookingDateStr = bookingStart.toISOString().split('T')[0]
        if (bookingDateStr !== selectedDate) return false
        
        const bookingStartMinutes = dateToMinutes(bookingStart)
        const bookingEndMinutes = dateToMinutes(bookingEnd)
        
        const overlaps = slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes
        const startsAtBookingEnd = slotStartMinutes === bookingEndMinutes
        
        return overlaps || startsAtBookingEnd
      } catch (e) {
        return false
      }
    })
    
    return booking
  }

  // Check if slot is selected as start time
  const isStartTime = (slotTime) => {
    return startTime === slotTime
  }
  
  // Check if slot is selected as end time
  const isEndTime = (slotTime) => {
    return endTime === slotTime
  }

  // Check if slot is in the selected time range
  const isInSelectedRange = (slotTime) => {
    if (!startTime) return false
    if (!endTime) return false // Only show range when both are selected
    
    // Use simple string comparison first
    if (slotTime === startTime || slotTime === endTime) {
      return false // Start and end are handled separately by isStartTime
    }
    
    // Convert to minutes for comparison
    const slotMinutes = timeToMinutes(slotTime)
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    
    // Check if slot is between start and end (exclusive of boundaries)
    return slotMinutes > startMinutes && slotMinutes < endMinutes
  }

  // Check if a slot is part of a continuous booking (for visual styling)
  const getBookingContinuity = (slotTime) => {
    if (!bookedSlots || bookedSlots.length === 0) return { isStart: false, isEnd: false, isMiddle: false }
    
    const slotStartMinutes = timeToMinutes(slotTime)
    const slotEndMinutes = slotStartMinutes + intervalMinutes
    
    for (const booking of bookedSlots) {
      try {
        const bookingStart = new Date(booking.startTime)
        const bookingEnd = new Date(booking.endTime)
        
        const bookingDateStr = bookingStart.toISOString().split('T')[0]
        if (bookingDateStr !== selectedDate) continue
        
        const bookingStartMinutes = dateToMinutes(bookingStart)
        const bookingEndMinutes = dateToMinutes(bookingEnd)
        
        const overlaps = slotStartMinutes < bookingEndMinutes && slotEndMinutes > bookingStartMinutes
        const startsAtBookingEnd = slotStartMinutes === bookingEndMinutes
        
        if (overlaps || startsAtBookingEnd) {
          const isStart = Math.abs(slotStartMinutes - bookingStartMinutes) < 1 // Within 1 minute
          const isEnd = Math.abs(slotEndMinutes - bookingEndMinutes) < 1 || startsAtBookingEnd
          const isMiddle = !isStart && !isEnd
          
          return { isStart, isEnd, isMiddle, booking }
        }
      } catch (e) {
        continue
      }
    }
    
    return { isStart: false, isEnd: false, isMiddle: false }
  }

  // Handle slot click
  const handleSlotClick = (slotTime) => {
    // Don't allow clicking booked slots
    if (isSlotBooked(slotTime)) {
      const bookingInfo = getBookingInfo(slotTime)
      if (bookingInfo) {
        toast.error(`This slot is already booked: ${bookingInfo.title}`, { duration: 3000 })
      }
      return
    }
    
    // If no start time selected, or both start and end are selected, start new selection
    if (!startTime || (startTime && endTime)) {
      onStartTimeChange(slotTime)
      if (endTime) {
        onEndTimeChange('')
      }
    } 
    // If start time is selected but not end time, complete the selection
    else if (startTime && !endTime) {
      // Parse times to compare
      const [startH, startM] = startTime.split(':').map(Number)
      const [endH, endM] = slotTime.split(':').map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM
      
      let finalStartTime = startTime
      let finalEndTime = slotTime
      
      // If clicked time is before start time, swap them
      if (endMinutes <= startMinutes) {
        finalStartTime = slotTime
        finalEndTime = startTime
      }
      
      // Check if the entire range conflicts with any booking
      if (doesRangeConflict(finalStartTime, finalEndTime)) {
        // Find which booking conflicts
        const conflict = bookedSlots.find(booking => {
          const bookingStart = new Date(booking.startTime)
          const bookingEnd = new Date(booking.endTime)
          const rangeStart = new Date(`${selectedDate}T${finalStartTime}:00`)
          const rangeEnd = new Date(`${selectedDate}T${finalEndTime}:00`)
          return (rangeStart < bookingEnd && rangeEnd > bookingStart)
        })
        
        if (conflict) {
          const conflictStart = new Date(conflict.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          const conflictEnd = new Date(conflict.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          toast.error(
            `Time conflict! This range overlaps with:\n"${conflict.title}" - ${conflict.student || 'Unknown'} (${conflict.course || 'Unknown'})\n${conflictStart} - ${conflictEnd}`,
            {
              duration: 6000,
              style: {
                maxWidth: '400px',
                whiteSpace: 'pre-line'
              }
            }
          )
          return
        }
      }
      
      // Range is valid, set it
      if (endMinutes > startMinutes) {
        onEndTimeChange(slotTime)
      } else {
        onStartTimeChange(slotTime)
        onEndTimeChange(startTime)
      }
    }
  }

  // Format time for display
  const formatTime = (timeString) => {
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (!selectedDate) {
    return (
      <div className="p-4 text-center text-slate-500 bg-slate-50 rounded-lg">
        Please select a date first
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-slate-700">
          Select Time Slot
        </label>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-green-100 border border-green-300 rounded"></div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-slate-200 border border-slate-300 rounded"></div>
            <span>Booked</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-4 h-4 bg-sky-200 border-2 border-sky-500 rounded"></div>
            <span>Selected</span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 bg-slate-50 rounded-lg border border-slate-200">
        {timeSlots.map((slotTime) => {
          const booked = isSlotBooked(slotTime)
          const isStart = isStartTime(slotTime)
          const isEnd = isEndTime(slotTime)
          const inRange = isInSelectedRange(slotTime)
          const selected = isStart || isEnd || inRange
          const bookingInfo = getBookingInfo(slotTime)
          const continuity = getBookingContinuity(slotTime)
          const isHovered = hoveredSlot === slotTime
          
          // Determine border radius based on continuity
          let borderRadiusClass = 'rounded-lg'
          if (booked && continuity.isStart && !continuity.isEnd) {
            borderRadiusClass = 'rounded-l-lg rounded-r-none'
          } else if (booked && continuity.isEnd && !continuity.isStart) {
            borderRadiusClass = 'rounded-r-lg rounded-l-none'
          } else if (booked && continuity.isMiddle) {
            borderRadiusClass = 'rounded-none'
          }
          
          return (
            <button
              key={slotTime}
              type="button"
              onClick={() => handleSlotClick(slotTime)}
              onMouseEnter={() => setHoveredSlot(slotTime)}
              onMouseLeave={() => setHoveredSlot(null)}
              disabled={booked}
              className={`
                relative px-3 py-2 text-xs font-medium transition-all ${borderRadiusClass}
                ${booked 
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed border border-slate-300' 
                  : selected
                  ? 'bg-sky-300 text-sky-900 border-2 border-sky-600 shadow-lg ring-2 ring-sky-400 font-bold scale-105'
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-sky-50 hover:border-sky-300 hover:shadow-sm cursor-pointer active:scale-95'
                }
                ${isHovered && bookingInfo ? 'z-10' : ''}
                ${booked && continuity.isMiddle ? 'border-l-0' : ''}
              `}
              title={booked && bookingInfo 
                ? `Booked: ${bookingInfo.title} - ${bookingInfo.student || 'Unknown'} (${bookingInfo.course || 'Unknown'})\n${new Date(bookingInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(bookingInfo.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` 
                : formatTime(slotTime)
              }
            >
              {formatTime(slotTime)}
              {selected && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-sky-600 rounded-full border-2 border-white flex items-center justify-center">
                  <span className="text-white text-[8px]">✓</span>
                </span>
              )}
              {booked && continuity.isStart && !selected && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
              
              {/* Tooltip for booked slots */}
              {isHovered && bookingInfo && (
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 text-white text-xs rounded shadow-lg z-20 whitespace-nowrap">
                  <div className="font-semibold">{bookingInfo.title}</div>
                  <div className="text-slate-300">
                    {bookingInfo.student || 'Unknown'} ({bookingInfo.course || 'Unknown'})
                  </div>
                  <div className="text-slate-400 text-xs">
                    {new Date(bookingInfo.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                    {new Date(bookingInfo.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-full w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-900"></div>
                </div>
              )}
            </button>
          )
        })}
      </div>
      
      {startTime && (
        <div className={`text-sm p-2 rounded-lg border ${
          endTime && doesRangeConflict(startTime, endTime)
            ? 'bg-red-50 border-red-200 text-red-700'
            : 'bg-sky-50 border-sky-200 text-slate-600'
        }`}>
          <span className="font-medium">Selected:</span> {formatTime(startTime)}
          {endTime && ` - ${formatTime(endTime)}`}
          {!endTime && <span className="text-slate-500"> (select end time)</span>}
          {endTime && doesRangeConflict(startTime, endTime) && (
            <span className="block text-xs text-red-600 mt-1">⚠️ This time range conflicts with an existing booking!</span>
          )}
        </div>
      )}
    </div>
  )
}

