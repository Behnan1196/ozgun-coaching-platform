# 🔔 Video Call Ringing Debug Guide

## Problem: Ring notifications not reaching the other person

### ✅ **Step-by-Step Testing Process:**

#### **BOTH Computers Must Do This (CRITICAL):**

1. **Login to the app** with different accounts
2. **Go to Video tab** (this initializes the Stream video client)
3. **Select the same partner** (this creates the same call ID)
4. **Click "Görüşme Ayarla"** on both sides (this creates the call with members)

#### **Then Test Ringing:**
5. **One person clicks "Ara"** (this sends the ring)
6. **Other person should see incoming call notification**

---

### 🔧 **Console Debugging:**

#### **On CALLER side, you should see:**
```
🌊 Initializing Stream.io clients for user: [user-id]
✅ Video call ready with members: [user1, user2]  
📹 Setting up video call...
✅ Video call setup complete - ready to ring
📞 Ringing video call...
✅ Video call ringing sent
📞 Call details for debugging: {callId: "...", members: [...]}
```

#### **On RECEIVER side, you should see:**
```
🌊 Initializing Stream.io clients for user: [user-id]
✅ Video call ready with members: [user1, user2]
📞 Incoming call received: [call object]
📞 Call details: {callId: "...", from: "...", members: [...]}
```

---

### ❌ **Common Issues:**

#### **Issue 1: Receiver never initialized video**
- **Problem:** Receiver didn't go to Video tab
- **Solution:** Both users must go to Video tab and select partner

#### **Issue 2: Different call IDs**
- **Problem:** Users selected different partners or IDs don't match
- **Solution:** Make sure both users select each other as partners

#### **Issue 3: Stream.io not connected**
- **Problem:** One side isn't connected to Stream.io
- **Solution:** Check for "✅ Stream.io clients ready" in console

#### **Issue 4: Wrong user IDs**
- **Problem:** User IDs don't match what's expected
- **Solution:** Check the user IDs in the call members array

---

### 🔍 **Advanced Debugging:**

Run this in browser console on **BOTH** computers:

```javascript
// Check Stream connection status
window.debugStream?.()

// Or manually check:
console.log('Stream Debug:', {
  hasVideoClient: !!window.streamVideoClient,
  hasVideoCall: !!window.streamVideoCall,
  userId: window.currentUserId
})
```

---

### 📋 **Checklist Before Testing:**

- [ ] Both users logged in to different accounts
- [ ] Both users went to Video tab
- [ ] Both users selected each other as partner
- [ ] Both users clicked "Görüşme Ayarla" 
- [ ] Both users see their camera working
- [ ] Console shows "✅ Video call ready with members" on both sides
- [ ] Call members array contains both user IDs

**Only then** should one person click "Ara" to test ringing!

---

### 🎯 **Expected Behavior:**
1. **Caller:** Sees camera + "📞 [Name] aranıyor..." overlay
2. **Receiver:** Gets bouncing phone animation + "Kabul Et"/"Reddet" buttons
3. **Both:** Can see console logs confirming the ring was sent/received 