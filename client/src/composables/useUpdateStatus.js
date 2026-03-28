import { ref, onMounted, onUnmounted } from 'vue'

export function useUpdateStatus() {
  const isUpdating = ref(false)
  const updateMessage = ref('')
  let pollInterval = null

  const checkUpdateStatus = async () => {
    try {
      const response = await fetch('/api/update-status')
      const contentType = response.headers.get('content-type')
      if (response.ok && contentType && contentType.includes('application/json')) {
        const data = await response.json()
        isUpdating.value = data.isUpdating
        updateMessage.value = data.message || ''
      }
    } catch (error) {
      // Silently ignore - endpoint may not exist
    }
  }

  const startPolling = (intervalMs = 5000) => {
    // Check immediately
    checkUpdateStatus()
    
    // Then poll every 5 seconds
    pollInterval = setInterval(checkUpdateStatus, intervalMs)
  }

  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval)
      pollInterval = null
    }
  }

  onMounted(() => {
    startPolling()
  })

  onUnmounted(() => {
    stopPolling()
  })

  return {
    isUpdating,
    updateMessage,
    checkUpdateStatus,
    startPolling,
    stopPolling
  }
}
