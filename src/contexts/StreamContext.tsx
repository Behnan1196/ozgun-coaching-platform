'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { StreamChat, Channel, User as StreamUser } from 'stream-chat'
import { StreamVideoClient, Call } from '@stream-io/video-react-sdk'
import { createClient } from '@/lib/supabase/client'
import { 
  createStreamChatClient, 
  createStreamVideoClient, 
  generateUserToken, 
  createCoachStudentChannel,
  createVideoCall,
  StreamUtils 
} from '@/lib/stream'

interface StreamContextType {
  // Chat
  chatClient: StreamChat | null
  chatChannel: Channel | null
  chatLoading: boolean
  chatError: string | null
  
  // Video
  videoClient: StreamVideoClient | null
  videoCall: Call | null
  videoLoading: boolean
  videoError: string | null
  
  // Video Call States
  incomingCall: Call | null
  outgoingCall: Call | null
  callState: 'idle' | 'setup' | 'ready' | 'outgoing' | 'incoming' | 'active' | 'ended'
  
  // Actions
  initializeChat: (partnerId: string) => Promise<void>
  initializeVideo: (partnerId: string) => Promise<void>
  setupVideoCall: () => Promise<void>
  startVideoCall: () => Promise<void>
  endVideoCall: () => Promise<void>
  acceptIncomingCall: () => Promise<void>
  rejectIncomingCall: () => Promise<void>
  cancelOutgoingCall: () => Promise<void>
  
  // Status
  isStreamReady: boolean
  isDemoMode: boolean
  debugStreamConnection: () => void
}

const StreamContext = createContext<StreamContextType | undefined>(undefined)

interface StreamProviderProps {
  children: ReactNode
}

export function StreamProvider({ children }: StreamProviderProps) {
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()
  
  // Chat state
  const [chatClient, setChatClient] = useState<StreamChat | null>(null)
  const [chatChannel, setChatChannel] = useState<Channel | null>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatError, setChatError] = useState<string | null>(null)
  
  // Video state
  const [videoClient, setVideoClient] = useState<StreamVideoClient | null>(null)
  const [videoCall, setVideoCall] = useState<Call | null>(null)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoError, setVideoError] = useState<string | null>(null)
  
  // Video call states
  const [incomingCall, setIncomingCall] = useState<Call | null>(null)
  const [outgoingCall, setOutgoingCall] = useState<Call | null>(null)
  const [callState, setCallState] = useState<'idle' | 'setup' | 'ready' | 'outgoing' | 'incoming' | 'active' | 'ended'>('idle')
  
  // General state
  const [isStreamReady, setIsStreamReady] = useState(false)
  const isDemoMode = StreamUtils.isDemoMode()

  // Get current user
  useEffect(() => {
    const getUser = async () => {
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (authUser) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', authUser.id)
          .single()
        
        if (profile) {
          setUser({
            id: authUser.id,
            email: authUser.email,
            username: profile.email?.split('@')[0] || 'user',
            full_name: profile.full_name
          })
        }
      }
    }
    getUser()
  }, [])

  // Initialize Stream clients when user logs in
  useEffect(() => {
    const initializeStreamClients = async () => {
      if (!user) {
        // Clean up if user logs out
        if (chatClient) {
          await chatClient.disconnectUser()
          setChatClient(null)
        }
        if (videoClient) {
          await videoClient.disconnectUser()
          setVideoClient(null)
        }
        setIsStreamReady(false)
        return
      }

      // Skip if already initialized for this user
      if (chatClient && videoClient && isStreamReady) {
        console.log('🔄 Stream clients already initialized for user:', user.id)
        return
      }

      // Clean up existing clients if they exist for a different user
      if (chatClient || videoClient) {
        console.log('🧹 Cleaning up existing Stream clients...')
        try {
          if (chatClient) {
            await chatClient.disconnectUser()
            setChatClient(null)
          }
          if (videoClient) {
            await videoClient.disconnectUser()
            setVideoClient(null)
          }
        } catch (error) {
          console.warn('⚠️ Error cleaning up existing clients:', error)
        }
        setIsStreamReady(false)
      }

      try {
        console.log('🌊 Initializing Stream.io clients for user:', user.id)
        
        // Format user for Stream.io
        const streamUser = StreamUtils.formatStreamUser(user)
        console.log('👤 Stream user formatted:', streamUser)
        
        // Generate token
        const token = await generateUserToken(user.id)
        console.log('🔑 Token generated, length:', token.length)
        
        // Initialize Chat Client
        const chat = createStreamChatClient()
        console.log('💬 Connecting to Stream Chat with user:', streamUser.id)
        
        await chat.connectUser(streamUser as StreamUser, token)
        setChatClient(chat)
        console.log('💬 Stream Chat client initialized successfully')
        
        // Initialize Video Client
        const video = createStreamVideoClient({ 
          id: user.id, 
          name: user.full_name || user.username 
        }, token)
        
        // Listen for incoming calls
        video.on('call.ring', (event: any) => {
          console.log('📞 Incoming call received:', event.call)
          console.log('📞 Call details:', {
            callId: event.call.id,
            from: event.call.created_by,
            members: event.call.state.members
          })
          setIncomingCall(event.call)
          setCallState('incoming')
        })
        
        // Listen for call accepted
        video.on('call.accepted', (event: any) => {
          console.log('✅ Call accepted:', event.call)
          setCallState('active')
        })
        
        // Listen for call rejected
        video.on('call.rejected', (event: any) => {
          console.log('❌ Call rejected:', event.call)
          setCallState('ended')
          setOutgoingCall(null)
          setIncomingCall(null)
        })
        
        // Listen for call ended
        video.on('call.ended', (event: any) => {
          console.log('📞 Call ended:', event.call)
          setCallState('ended')
          setVideoCall(null)
          setOutgoingCall(null)
          setIncomingCall(null)
          // Reset to idle after a brief delay
          setTimeout(() => setCallState('idle'), 2000)
        })
        

        
        setVideoClient(video)
        console.log('📹 Stream Video client initialized successfully')
        
        setIsStreamReady(true)
        console.log('✅ Stream.io clients ready')
        
      } catch (error) {
        console.error('❌ Failed to initialize Stream.io clients:', error)
        console.error('❌ Error details:', {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined,
          user: user.id,
          isDemoMode: StreamUtils.isDemoMode()
        })
        setChatError(`Failed to initialize chat: ${error instanceof Error ? error.message : 'Unknown error'}`)
        setVideoError(`Failed to initialize video: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }

    initializeStreamClients()
    
    // Cleanup function to prevent memory leaks
    return () => {
      // Don't cleanup immediately, but mark for cleanup if component unmounts
    }
  }, [user?.id]) // Only depend on user.id to prevent unnecessary re-renders

  // Initialize chat channel
  const initializeChat = async (partnerId: string) => {
    if (!chatClient || !user) {
      setChatError('Chat client not ready')
      return
    }

    // Check if trying to chat with self
    if (user.id === partnerId) {
      setChatError('Cannot start a chat with yourself')
      return
    }

    setChatLoading(true)
    setChatError(null)

    try {
      console.log('💬 Initializing chat channel with partner:', partnerId)
      
      // First, ensure the partner user exists in Stream.io
      try {
        console.log('👤 Creating/updating partner user in Stream.io:', partnerId)
        
        // Get partner info from Supabase
        const supabase = createClient()
        const { data: partnerProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', partnerId)
          .single()
        
        if (partnerProfile) {
          // Create/update partner user in Stream.io
          const partnerStreamUser = StreamUtils.formatStreamUser({
            id: partnerProfile.id,
            email: partnerProfile.email,
            full_name: partnerProfile.full_name,
            username: partnerProfile.email?.split('@')[0] || 'user'
          })
          
          console.log('👤 Partner user formatted:', partnerStreamUser)
          
          // Upsert partner user in Stream.io
          await chatClient.upsertUser(partnerStreamUser as StreamUser)
          console.log('✅ Partner user created/updated in Stream.io')
        }
      } catch (userError) {
        console.warn('⚠️ Could not create partner user, continuing anyway:', userError)
      }
      
      const channel = createCoachStudentChannel(chatClient, user.id, partnerId)
      await channel.create()
      await channel.watch()
      
      setChatChannel(channel)
      console.log('✅ Chat channel ready')
      
    } catch (error) {
      console.error('❌ Failed to initialize chat channel:', error)
      setChatError('Failed to initialize chat channel')
    } finally {
      setChatLoading(false)
    }
  }

  // Initialize video call
  const initializeVideo = async (partnerId: string) => {
    if (!videoClient || !user) {
      setVideoError('Video client not ready')
      return
    }

    // Check if trying to call self
    if (user.id === partnerId) {
      setVideoError('Cannot start a video call with yourself')
      return
    }

    setVideoLoading(true)
    setVideoError(null)

    try {
      console.log('📹 Initializing video call with partner:', partnerId)
      
      // Ensure partner user exists (similar to chat)
      try {
        console.log('👤 Ensuring partner user exists for video call:', partnerId)
        
        const supabase = createClient()
        const { data: partnerProfile } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', partnerId)
          .single()
        
        if (partnerProfile) {
          console.log('✅ Partner profile found for video call')
        }
      } catch (userError) {
        console.warn('⚠️ Could not verify partner user for video, continuing anyway:', userError)
      }
      
      const call = createVideoCall(videoClient, user.id, partnerId)
      
      // Create the call with both members so they can receive ring notifications
      await call.create({
        ring: false, // Don't ring immediately when creating
        data: {
          members: [
            { user_id: user.id },
            { user_id: partnerId }
          ]
        }
      })
      
      setVideoCall(call)
      console.log('✅ Video call ready with members:', [user.id, partnerId])
      
    } catch (error) {
      console.error('❌ Failed to initialize video call:', error)
      setVideoError('Failed to initialize video call')
    } finally {
      setVideoLoading(false)
    }
  }

  // Setup video call (prepare camera interface)
  const setupVideoCall = async () => {
    if (!videoCall) {
      setVideoError('Video call not initialized')
      return
    }

    try {
      console.log('📹 Setting up video call...')
      setCallState('setup')
      
      // Check if camera is available
      try {
        const devices = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        // Release the test stream immediately
        devices.getTracks().forEach(track => track.stop())
        console.log('✅ Camera and microphone are available')
      } catch (deviceError: any) {
        console.error('❌ Media device error:', deviceError)
        
        if (deviceError.name === 'NotReadableError') {
          setVideoError('Camera is already in use by another application. Please close other video apps and try again.')
          setCallState('idle')
          return
        } else if (deviceError.name === 'NotAllowedError') {
          setVideoError('Camera permission denied. Please allow camera access and try again.')
          setCallState('idle')
          return
        } else if (deviceError.name === 'NotFoundError') {
          setVideoError('No camera found. Please connect a camera and try again.')
          setCallState('idle')
          return
        } else {
          setVideoError(`Camera error: ${deviceError.message}`)
          setCallState('idle')
          return
        }
      }
      
      // Just prepare the call (don't join yet - only join when ringing or accepting)
      setCallState('ready')
      console.log('✅ Video call setup complete - ready to ring (not joined yet)')
      
    } catch (error: any) {
      console.error('❌ Failed to setup video call:', error)
      setCallState('idle')
      
      // Provide specific error messages
      if (error.message?.includes('Device in use')) {
        setVideoError('Camera is in use by another application. Please close other video apps and try again.')
      } else if (error.message?.includes('Permission denied')) {
        setVideoError('Camera permission denied. Please allow camera access in your browser.')
      } else {
        setVideoError(`Failed to setup video call: ${error.message || 'Unknown error'}`)
      }
    }
  }

  // Start video call (ring the other person from ready state)
  const startVideoCall = async () => {
    if (!videoCall) {
      setVideoError('Video call not initialized')
      return
    }

    if (callState !== 'ready') {
      setVideoError('Video call not ready. Please setup the call first.')
      return
    }

    try {
      console.log('📞 Ringing video call...')
      setCallState('outgoing')
      setOutgoingCall(videoCall)
      
      // First join the call locally, then ring
      await videoCall.join()
      console.log('✅ Joined call locally')
      
      // Ring the other participants (this sends the notification)
      await videoCall.ring()
      console.log('✅ Video call ringing sent')
      console.log('📞 Call details for debugging:', {
        callId: videoCall.id,
        callType: videoCall.type,
        members: videoCall.state.members,
        createdBy: videoCall.state.createdBy
      })
      
    } catch (error: any) {
      console.error('❌ Failed to start video call:', error)
      setCallState('ready') // Go back to ready state
      setOutgoingCall(null)
      
      setVideoError(`Failed to start video call: ${error.message || 'Unknown error'}`)
    }
  }

  // End video call
  const endVideoCall = async () => {
    if (!videoCall) return

    try {
      console.log('📞 Ending video call...')
      await videoCall.leave()
      setCallState('ended')
      setVideoCall(null)
      setOutgoingCall(null)
      setIncomingCall(null)
      // Reset to idle after a brief delay
      setTimeout(() => setCallState('idle'), 2000)
      console.log('✅ Video call ended')
      
    } catch (error) {
      console.error('❌ Failed to end video call:', error)
      setVideoError('Failed to end video call')
    }
  }

  // Accept incoming call
  const acceptIncomingCall = async () => {
    if (!incomingCall) return

    try {
      console.log('✅ Accepting incoming call...')
      await incomingCall.join()
      setVideoCall(incomingCall)
      setIncomingCall(null)
      setCallState('active')
      console.log('✅ Incoming call accepted and joined')
    } catch (error: any) {
      console.error('❌ Failed to accept call:', error)
      setVideoError(`Failed to accept call: ${error.message}`)
      setCallState('idle')
      setIncomingCall(null)
    }
  }

  // Reject incoming call
  const rejectIncomingCall = async () => {
    if (!incomingCall) return

    try {
      console.log('❌ Rejecting incoming call...')
      await incomingCall.reject()
      setIncomingCall(null)
      setCallState('idle')
      console.log('✅ Incoming call rejected')
    } catch (error: any) {
      console.error('❌ Failed to reject call:', error)
      setVideoError(`Failed to reject call: ${error.message}`)
      setCallState('idle')
      setIncomingCall(null)
    }
  }

  // Cancel outgoing call
  const cancelOutgoingCall = async () => {
    if (!outgoingCall) return

    try {
      console.log('❌ Canceling outgoing call...')
      await outgoingCall.leave()
      setOutgoingCall(null)
      setCallState('idle')
      console.log('✅ Outgoing call canceled')
    } catch (error: any) {
      console.error('❌ Failed to cancel call:', error)
      setVideoError(`Failed to cancel call: ${error.message}`)
      setCallState('idle')
      setOutgoingCall(null)
    }
  }

  // Debug function to check connection status
  const debugStreamConnection = () => {
    console.log('🔧 Stream Connection Debug:', {
      chatClient: !!chatClient,
      videoClient: !!videoClient,
      currentUser: user?.id,
      isStreamReady,
      callState,
      hasVideoCall: !!videoCall,
      hasIncomingCall: !!incomingCall,
      hasOutgoingCall: !!outgoingCall
    })
    
    if (videoCall) {
      console.log('🔧 Video Call State:', {
        callId: videoCall.id,
        callType: videoCall.type,
        members: videoCall.state.members
      })
    }
  }

  const value: StreamContextType = {
    // Chat
    chatClient,
    chatChannel,
    chatLoading,
    chatError,
    
    // Video
    videoClient,
    videoCall,
    videoLoading,
    videoError,
    
    // Video Call States
    incomingCall,
    outgoingCall,
    callState,
    
    // Actions
    initializeChat,
    initializeVideo,
    setupVideoCall,
    startVideoCall,
    endVideoCall,
    acceptIncomingCall,
    rejectIncomingCall,
    cancelOutgoingCall,
    
    // Status
    isStreamReady,
    isDemoMode,
    debugStreamConnection,
  }

  return (
    <StreamContext.Provider value={value}>
      {children}
    </StreamContext.Provider>
  )
}

export function useStream() {
  const context = useContext(StreamContext)
  if (context === undefined) {
    throw new Error('useStream must be used within a StreamProvider')
  }
  return context
}

export default StreamProvider 