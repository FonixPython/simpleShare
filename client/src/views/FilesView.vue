<template>
  <div class="w-full h-full pt-[120px] mobile:pt-[100px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">
      <div class="w-full mb-6">
        <div class="relative w-full">
          <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
          <input 
            v-model="searchQuery"
            type="text" 
            placeholder="Search files..." 
            class="pl-10 pr-4 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none w-full">
        </div>
      </div>

      <div v-if="loading" class="flex justify-center items-center py-12">
        <span class="material-icons-outlined animate-spin-slow text-4xl text-primary-button">hourglass_empty</span>
      </div>

      <div v-else-if="error" class="bg-error/20 border border-error rounded-lg p-4 text-error text-center">
        {{ error }}
      </div>

      <div v-else class="bg-black/20 backdrop-blur-[20px] rounded-xl border border-[#444] overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-black/30">
              <tr>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Code</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Filename</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Owner</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Size</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Date</th>
                <th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                v-for="file in filteredFiles" 
                :key="file.id"
                class="border-b border-[#444] hover:bg-black/20 transition-colors">
                <td class="px-4 py-3 text-sm font-mono">{{ file.code }}</td>
                <td class="px-4 py-3 text-sm">{{ file.name }}</td>
                <td class="px-4 py-3 text-sm">{{ file.username }}</td>
                <td class="px-4 py-3 text-sm">{{ file.sizeFormatted }}</td>
                <td class="px-4 py-3 text-sm">{{ file.dateFormatted }}</td>
                <td class="px-4 py-3 text-sm text-center">
                  <div class="flex items-center justify-center gap-2">
                    <button 
                      @click="downloadFile(file.code)"
                      class="bg-secondary-button text-black w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform">
                      <span class="material-icons-outlined text-sm">download</span>
                    </button>
                    <button 
                      @click="handleDeleteFile(file)"
                      class="bg-error text-white w-8 h-8 rounded flex items-center justify-center hover:scale-105 transition-transform">
                      <span class="material-icons-outlined text-sm">delete</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <div v-if="filteredFiles.length === 0" class="text-center py-8 text-gray-400">
            No files found
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
import { useConfirm } from '../composables/useConfirm.js'

export default {
  name: 'FilesView',
  props: {
    token: String
  },
  setup(props) {
    const { 
      allFiles, 
      loading, 
      error, 
      loadAllFiles, 
      deleteFile,
      formatBytes
    } = useAdmin()
    
    const { showNotification } = useNotification()
    const { confirmDelete } = useConfirm()

    const searchQuery = ref('')

    const filteredFiles = computed(() => {
      let filtered = allFiles.value

      // Apply search filter
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase()
        filtered = filtered.filter(file => 
          file.name.toLowerCase().includes(query) ||
          file.code.toLowerCase().includes(query) ||
          file.username.toLowerCase().includes(query)
        )
      }

      // Default sort by date (newest first)
      filtered.sort((a, b) => new Date(b.date) - new Date(a.date))

      return filtered
    })

    const handleDeleteFile = async (file) => {
      try {
        await confirmDelete(`file "${file.name}"`)
        const result = await deleteFile(props.token, file.code)
        if (result.success) {
          showNotification('File deleted successfully!', 'ok')
          await loadAllFiles(props.token)
        } else {
          showNotification('Failed to delete file: ' + result.error, 'error')
        }
      } catch {
        // User cancelled the deletion
      }
    }

    const downloadFile = (code) => {
      const link = document.createElement("a")
      link.href = "/files/" + code
      link.style.display = "none"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      showNotification('Download started!', 'info')
    }

    onMounted(() => {
      loadAllFiles(props.token)
    })

    return {
      allFiles,
      loading,
      error,
      searchQuery,
      filteredFiles,
      handleDeleteFile,
      downloadFile
    }
  }
}
</script>
