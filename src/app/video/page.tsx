'use client'

import React, { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { StreamVideoCall } from '@/components/StreamVideo'

export default function VideoPage() {
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
    return (
      <div className="h-screen bg-gray-900 flex items-center justify-center text-white">
        <div className="text-center">
          <div className="text-4xl mb-4">📹</div>
          <p>Video görüşme hazırlanıyor...</p>
        </div>
      </div>
    )
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