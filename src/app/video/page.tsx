'use client'

import React, { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { StreamVideoCall } from '@/components/StreamVideo'

// Loading component for Suspense
function VideoLoading() {
  return (
    <div className="h-screen bg-gray-900 flex items-center justify-center text-white">
      <div className="text-center">
        <div className="text-4xl mb-4">📹</div>
        <p>Video görüşme hazırlanıyor...</p>
      </div>
    </div>
  )
}

// Video content component that uses useSearchParams
function VideoContent() {
  const searchParams = useSearchParams()
  const [callId, setCallId] = useState<string>('')
  const [partnerName, setPartnerName] = useState<string>('')

  useEffect(() => {
    // Get call details from URL parameters
    const id = searchParams.get('callId') || 'general-call'
    const partner = searchParams.get('partner') || 'Partner'
    
    setCallId(id)
    setPartnerName(partner)
  }, [searchParams])

  if (!callId) {
    return <VideoLoading />
  }

  return (
    <div className="h-screen bg-gray-900">
      <StreamVideoCall 
        partnerId={callId}
        partnerName={partnerName}
        className="h-full"
      />
    </div>
  )
}

// Main page component with Suspense boundary
export default function VideoPage() {
  return (
    <Suspense fallback={<VideoLoading />}>
      <VideoContent />
    </Suspense>
  )
} 