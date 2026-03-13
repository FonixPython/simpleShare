<template>
  <div class="w-full h-full pt-[100px] mobile:pt-[80px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-white">Global Storage Management</h2>
        <button 
          @click="refreshData"
          :disabled="loading"
          class="bg-primary-button text-black px-4 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
          <span 
            :class="[
              'material-icons text-sm',
              loading ? 'animate-spin-slow' : ''
            ]">refresh</span>
          Refresh
        </button>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <span class="material-icons-outlined animate-spin-slow text-4xl text-primary-button">hourglass_empty</span>
      </div>

      <div v-else-if="error" class="bg-error/20 border border-error rounded-lg p-4 text-error text-center">
        {{ error }}
      </div>

      <div v-else class="space-y-6">
        <!-- Storage Overview -->
        <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
          <h3 class="text-xl font-bold text-white mb-4">Storage Overview</h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">Current Usage</h4>
              <div class="space-y-2">
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Used Storage</span>
                  <span class="text-sm font-medium">{{ globalStorage.totalStorageFormatted }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Storage Limit</span>
                  <span class="text-sm font-medium">{{ formatBytes(currentLimit) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-sm text-gray-400">Available Storage</span>
                  <span class="text-sm font-medium">{{ formatBytes(availableStorage) }}</span>
                </div>
              </div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-300 mb-3">Usage Progress</h4>
              <div class="space-y-3">
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-400">Storage Usage</span>
                    <span class="text-sm font-medium">{{ usagePercentage }}%</span>
                  </div>
                  <div class="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                    <div 
                      class="h-full bg-gradient-to-r from-primary-button to-secondary-button rounded-full transition-all duration-700 ease-out"
                      :style="{ width: usagePercentage + '%' }">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Storage Limit Management -->
        <div class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] p-6">
          <h3 class="text-xl font-bold text-white mb-4">Storage Limit Management</h3>
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-2">
                Global Storage Limit (0 = Unlimited)
              </label>
              <div class="flex gap-3">
                <input 
                  v-model.number="newStorageLimit"
                  type="number"
                  min="0"
                  step="1048576"
                  class="flex-1 bg-black/40 border border-gray-600 rounded-lg px-4 py-2 text-white focus:border-primary-button focus:outline-none"
                  placeholder="Enter storage limit in bytes"
                />
                <button 
                  @click="updateStorageLimit"
                  :disabled="loading || newStorageLimit < 0"
                  class="bg-primary-button text-black px-6 py-2 rounded-lg hover:opacity-90 transition-opacity flex items-center gap-2 disabled:opacity-50">
                  <span 
                    :class="[
                      'material-icons text-sm',
                      loading ? 'animate-spin-slow' : ''
                    ]">save</span>
                  Update Limit
                </button>
              </div>
              <p class="text-xs text-gray-500 mt-2">
                Current limit: {{ formatBytes(currentLimit) }} | 
                New limit: {{ formatBytes(newStorageLimit) }}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue'
import { useAdmin } from '../composables/useAdmin.js'
import { useNotification } from '../composables/useNotification.js'

export default {
  name: 'GlobalStorageView',
  props: {
    token: String
  },
  emits: ['navigate-to-stats', 'navigate-to-database'],
  setup(props) {
    const { 
      globalStorage, 
      loading, 
      error, 
      loadGlobalStorage,
      formatBytes,
      getStorageSettings,
      updateStorageLimit: updateStorageLimitAPI
    } = useAdmin()
    
    const { showNotification } = useNotification()

    const newStorageLimit = ref(0)
    const currentLimit = ref(0)

    const availableStorage = computed(() => {
      if (currentLimit.value === 0) return 0
      return Math.max(0, currentLimit.value - globalStorage.value.totalStorage)
    })

    const usagePercentage = computed(() => {
      if (currentLimit.value === 0) return 0
      return Math.round((globalStorage.value.totalStorage / currentLimit.value) * 100)
    })

    const refreshData = async () => {
      await loadGlobalStorage(props.token)
      const settings = await getStorageSettings(props.token)
      if (settings) {
        currentLimit.value = settings.globalStorageLimit
        newStorageLimit.value = settings.globalStorageLimit
      }
      showNotification('Storage data refreshed!', 'ok')
    }

    const updateStorageLimit = async () => {
      if (newStorageLimit.value < 0) {
        showNotification('Storage limit cannot be negative!', 'error')
        return
      }

      const result = await updateStorageLimitAPI(props.token, newStorageLimit.value)
      if (result.success) {
        currentLimit.value = newStorageLimit.value
        showNotification(result.message || 'Storage limit updated successfully!', 'ok')
        await refreshData()
      } else {
        showNotification(result.error || 'Failed to update storage limit!', 'error')
      }
    }

    onMounted(async () => {
      await loadGlobalStorage(props.token)
      const settings = await getStorageSettings(props.token)
      if (settings) {
        currentLimit.value = settings.globalStorageLimit
        newStorageLimit.value = settings.globalStorageLimit
      }
    })

    return {
      globalStorage,
      loading,
      error,
      availableStorage,
      usagePercentage,
      newStorageLimit,
      currentLimit,
      refreshData,
      updateStorageLimit,
      formatBytes
    }
  }
}
</script>
