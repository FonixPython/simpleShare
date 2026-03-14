<template>
  <div class="w-full h-full pt-[100px] mobile:pt-[80px] overflow-y-auto p-6">
    <div class="w-full max-w-7xl mx-auto">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-white">Users Management</h2>
        <div class="flex items-center gap-4">
          <div class="relative">
            <span class="material-icons-outlined absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">search</span>
            <input 
              v-model="searchQuery"
              type="text" 
              placeholder="Search users..." 
              class="pl-10 pr-4 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none w-64">
          </div>
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
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">ID</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Username</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Admin</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Quota</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Created</th>
                <th class="px-4 py-3 text-left text-sm font-medium text-gray-300">Files</th>
                <th class="px-4 py-3 text-center text-sm font-medium text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="user in filteredUsers" :key="user.user_id">
                <tr class="border-b border-[#444] hover:bg-black/20 transition-colors">
                  <td class="px-4 py-3 text-sm">{{ user.user_id }}</td>
                  <td class="px-4 py-3 text-sm font-medium">{{ user.username }}</td>
                  <td class="px-4 py-3 text-sm">
                    <span 
                      :class="[
                        'px-2 py-1 rounded-full text-xs font-medium',
                        user.is_admin 
                          ? 'bg-primary-button/20 text-primary-button' 
                          : 'bg-gray-600/20 text-gray-400'
                      ]">
                      {{ user.is_admin ? 'Admin' : 'User' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-sm">{{ user.quotaFormatted }}</td>
                  <td class="px-4 py-3 text-sm">
                    {{ new Date(user.creation_date).toLocaleDateString() }}
                  </td>
                  <td class="px-4 py-3 text-sm">
                    <div class="flex items-center gap-2">
                      <span class="text-gray-400">{{ user.files.length }}</span>
                      <button 
                        @click="toggleUserFiles(user.user_id)"
                        class="text-primary-button hover:text-primary-button/80 transition-colors">
                        <span class="material-icons-outlined text-sm">folder_open</span>
                      </button>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button 
                        @click="openChangeRoleDialog(user)"
                        class="bg-purple-600 text-white p-2 rounded-lg hover:opacity-90 transition-opacity"
                        title="Change Role">
                        <span class="material-icons-outlined text-sm">people</span>
                      </button>
                      <button 
                        @click="openChangePasswordDialog(user)"
                        class="bg-blue-600 text-white p-2 rounded-lg hover:opacity-90 transition-opacity"
                        title="Change Password">
                        <span class="material-icons-outlined text-sm">lock</span>
                      </button>
                      <button 
                        @click="openEditDialog(user)"
                        class="bg-yellow-600 text-white p-2 rounded-lg hover:opacity-90 transition-opacity"
                        title="Change Quota">
                        <span class="material-icons-outlined text-sm">list</span>
                      </button>
                      <button 
                        @click="openDeleteUserDialog(user)"
                        class="bg-red-600 text-white p-2 rounded-lg hover:opacity-90 transition-opacity"
                        title="Delete User">
                        <span class="material-icons-outlined text-sm">delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
                <!-- User files expansion -->
                <tr v-if="expandedUsers.includes(user.user_id)">
                  <td colspan="7" class="px-4 py-0">
                    <div class="bg-black/10 rounded-lg p-4 mb-2">
                      <h4 class="text-sm font-medium text-gray-300 mb-3">Files for {{ user.username }}</h4>
                      <div class="space-y-2">
                        <div 
                          v-for="file in user.files" 
                          :key="file.id"
                          class="flex items-center justify-between p-2 bg-black/20 rounded">
                          <div class="flex items-center gap-3">
                            <span class="text-xs text-gray-400">{{ file.code }}</span>
                            <span class="text-sm">{{ file.originalname }}</span>
                            <span class="text-xs text-gray-400">{{ file.sizeFormatted }}</span>
                            <span class="text-xs text-gray-400">{{ file.dateFormatted }}</span>
                          </div>
                          <div class="flex items-center gap-2">
                            <button 
                              @click="downloadFile(file.code)"
                              class="text-secondary-button hover:text-secondary-button/80 transition-colors">
                              <span class="material-icons-outlined text-sm">download</span>
                            </button>
                            <button 
                              @click="handleDeleteFile(file)"
                              class="text-error hover:text-error/80 transition-colors">
                              <span class="material-icons-outlined text-sm">delete</span>
                            </button>
                          </div>
                        </div>
                        <div v-if="user.files.length === 0" class="text-center text-gray-500 py-2">
                          No files found
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
          <div v-if="filteredUsers.length === 0" class="text-center py-8 text-gray-400">
            No users found
          </div>
        </div>
      </div>
    </div>

    <!-- Edit User Dialog -->
    <div v-if="editDialog.isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-black/90 backdrop-blur-[20px] rounded-xl border border-[#444] p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-white mb-4">Edit User: {{ editDialog.user?.username }}</h3>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Username</label>
            <input 
              v-model="editDialog.newUsername"
              type="text" 
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter new username">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">New Password</label>
            <input 
              v-model="editDialog.newPassword"
              type="password" 
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter new password (leave empty to keep current)">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Quota (bytes)</label>
            <input 
              v-model.number="editDialog.newQuota"
              type="number" 
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter quota in bytes">
          </div>

          <div>
            <label class="flex items-center gap-2 text-gray-300">
              <input 
                v-model="editDialog.isAdmin"
                type="checkbox" 
                class="w-4 h-4 text-primary-button bg-black/30 border-[#444] rounded focus:ring-primary-button">
              <span class="text-sm font-medium">Admin User</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="closeEditDialog"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button 
            @click="handleSaveUser"
            class="px-4 py-2 bg-primary-button text-white rounded-lg hover:opacity-90 transition-opacity">
            Save Changes
          </button>
        </div>
      </div>
    </div>

    <!-- Change Role Dialog -->
    <div v-if="changeRoleDialog.isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-black/90 backdrop-blur-[20px] rounded-xl border border-[#444] p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-white mb-4">Promote to Admin Confirmation</h3>
        
        <div class="mb-4">
          <p class="text-gray-300 mb-2">
            Are you sure you want to promote <span class="text-primary-button font-medium">{{ changeRoleDialog.user?.username }}</span> to admin?
          </p>
          <p class="text-gray-400 text-sm">
            This will grant the user full administrative privileges to manage all users, files, and system settings.
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Admin Password</label>
            <input 
              v-model="changeRoleDialog.adminPassword"
              type="password" 
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter admin password">
          </div>

          <div>
            <label class="flex items-center gap-2 text-gray-300">
              <input 
                v-model="changeRoleDialog.isAdmin"
                type="checkbox" 
                class="w-4 h-4 text-primary-button bg-black/30 border-[#444] rounded focus:ring-primary-button">
              <span class="text-sm font-medium">Admin User</span>
            </label>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="closeChangeRoleDialog"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button 
            @click="handleChangeRole"
            class="px-4 py-2 bg-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity">
            Promote to Admin
          </button>
        </div>
      </div>
    </div>

    <!-- Change Password Dialog -->
    <div v-if="changePasswordDialog.isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-black/90 backdrop-blur-[20px] rounded-xl border border-[#444] p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-white mb-4">Change Password</h3>
        
        <div class="mb-4">
          <p class="text-gray-300">
            Change password for <span class="text-primary-button font-medium">{{ changePasswordDialog.user?.username }}</span>
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Admin Password</label>
            <input 
              v-model="changePasswordDialog.adminPassword"
              type="password" 
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter admin password">
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">New Password</label>
            <input 
              v-model="changePasswordDialog.newPassword"
              type="password" 
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter new password">
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="closeChangePasswordDialog"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button 
            @click="handleChangePassword"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:opacity-90 transition-opacity">
            Change Password
          </button>
        </div>
      </div>
    </div>

    <!-- Delete User Dialog -->
    <div v-if="deleteUserDialog.isOpen" class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div class="bg-black/90 backdrop-blur-[20px] rounded-xl border border-[#444] p-6 w-full max-w-md">
        <h3 class="text-xl font-bold text-white mb-4">Delete User Confirmation</h3>
        
        <div class="mb-4">
          <p class="text-gray-300 mb-2">
            Are you sure you want to delete user <span class="text-red-400 font-medium">{{ deleteUserDialog.user?.username }}</span>?
          </p>
          <p class="text-gray-400 text-sm">
            This action cannot be undone. The user will be permanently deleted and all their files will be removed.
          </p>
        </div>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Admin Password</label>
            <input 
              v-model="deleteUserDialog.adminPassword"
              type="password" 
              class="w-full px-3 py-2 bg-black/30 border border-[#444] rounded-lg text-white focus:border-primary-button focus:outline-none"
              placeholder="Enter admin password to confirm">
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button 
            @click="closeDeleteUserDialog"
            class="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button 
            @click="handleConfirmDeleteUser"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:opacity-90 transition-opacity">
            Delete User
          </button>
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
  name: 'UsersView',
  props: {
    token: String
  },
  setup(props) {
    const { 
      users, 
      loading, 
      error, 
      loadUsers, 
      deleteUser, 
      deleteFile,
      changeUserPassword,
      changeUsername,
      changeUserQuota,
      changeUserAdminStatus
    } = useAdmin()
    
    const { showNotification } = useNotification()

    const searchQuery = ref('')
    const expandedUsers = ref([])
    const editDialog = ref({
      isOpen: false,
      user: null,
      newUsername: '',
      newPassword: '',
      newQuota: '',
      isAdmin: false
    })
    const changeRoleDialog = ref({
      isOpen: false,
      user: null,
      isAdmin: false,
      adminPassword: ''
    })
    const changePasswordDialog = ref({
      isOpen: false,
      user: null,
      adminPassword: '',
      newPassword: ''
    })
    const deleteUserDialog = ref({
      isOpen: false,
      user: null,
      adminPassword: ''
    })

    const filteredUsers = computed(() => {
      if (!searchQuery.value) return users.value
      
      const query = searchQuery.value.toLowerCase()
      return users.value.filter(user => 
        user.username.toLowerCase().includes(query) ||
        user.user_id.toString().includes(query)
      )
    })

    const toggleUserFiles = (userId) => {
      const index = expandedUsers.value.indexOf(userId)
      if (index > -1) {
        expandedUsers.value.splice(index, 1)
      } else {
        expandedUsers.value.push(userId)
      }
    }

    const handleDeleteUser = async (user) => {
      if (confirm(`Are you sure you want to delete user "${user.username}"? This will also delete all their files.`)) {
        const result = await deleteUser(props.token, user.user_id)
        if (result.success) {
          showNotification('User deleted successfully!', 'ok')
          await loadUsers(props.token)
        } else {
          showNotification('Failed to delete user: ' + result.error, 'error')
        }
      }
    }

    const handleDeleteFile = async (file) => {
      if (confirm(`Are you sure you want to delete file "${file.originalname}"?`)) {
        const result = await deleteFile(props.token, file.code)
        if (result.success) {
          showNotification('File deleted successfully!', 'ok')
          await loadUsers(props.token)
        } else {
          showNotification('Failed to delete file: ' + result.error, 'error')
        }
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

    const openEditDialog = (user) => {
      editDialog.value = {
        isOpen: true,
        user: user,
        newUsername: user.username,
        newPassword: '',
        newQuota: user.quota,
        isAdmin: user.is_admin
      }
    }

    const closeEditDialog = () => {
      editDialog.value.isOpen = false
    }

    const handleSaveUser = async () => {
      const { user, newUsername, newPassword, newQuota, isAdmin } = editDialog.value
      
      let hasChanges = false
      const promises = []
      
      // Check for username change
      if (newUsername !== user.username) {
        hasChanges = true
        promises.push(changeUsername(props.token, user.user_id, newUsername))
      }
      
      // Check for password change
      if (newPassword) {
        hasChanges = true
        promises.push(changeUserPassword(props.token, user.user_id, newPassword))
      }
      
      // Check for quota change
      if (newQuota !== user.quota) {
        hasChanges = true
        promises.push(changeUserQuota(props.token, user.user_id, newQuota))
      }
      
      // Check for admin status change
      if (isAdmin !== user.is_admin) {
        hasChanges = true
        promises.push(changeUserAdminStatus(props.token, user.user_id, isAdmin))
      }
      
      if (!hasChanges) {
        showNotification('No changes to save', 'info')
        closeEditDialog()
        return
      }
      
      try {
        const results = await Promise.all(promises)
        const failed = results.filter(result => !result.success)
        
        if (failed.length === 0) {
          showNotification('User updated successfully!', 'ok')
          closeEditDialog()
          await loadUsers(props.token)
        } else {
          showNotification('Some changes failed: ' + failed.map(f => f.error).join(', '), 'error')
        }
      } catch (error) {
        showNotification('Failed to update user: ' + error.message, 'error')
      }
    }

    const openChangeRoleDialog = (user) => {
      changeRoleDialog.value = {
        isOpen: true,
        user: user,
        isAdmin: user.is_admin,
        adminPassword: ''
      }
    }

    const closeChangeRoleDialog = () => {
      changeRoleDialog.value.isOpen = false
    }

    const handleChangeRole = async () => {
      const { user, isAdmin, adminPassword } = changeRoleDialog.value
      
      if (!adminPassword) {
        showNotification('Admin password is required', 'error')
        return
      }
      
      if (isAdmin !== user.is_admin) {
        const result = await changeUserAdminStatus(props.token, user.user_id, isAdmin)
        if (result.success) {
          showNotification(`User ${isAdmin ? 'promoted to' : 'demoted from'} admin successfully!`, 'ok')
          closeChangeRoleDialog()
          await loadUsers(props.token)
        } else {
          showNotification('Failed to change role: ' + result.error, 'error')
        }
      } else {
        showNotification('No role change detected', 'info')
        closeChangeRoleDialog()
      }
    }

    const openChangePasswordDialog = (user) => {
      changePasswordDialog.value = {
        isOpen: true,
        user: user,
        adminPassword: '',
        newPassword: ''
      }
    }

    const closeChangePasswordDialog = () => {
      changePasswordDialog.value.isOpen = false
    }

    const handleChangePassword = async () => {
      const { user, adminPassword, newPassword } = changePasswordDialog.value
      
      if (!adminPassword || !newPassword) {
        showNotification('Both passwords are required', 'error')
        return
      }
      
      const result = await changeUserPassword(props.token, user.user_id, newPassword)
      if (result.success) {
        showNotification('Password changed successfully!', 'ok')
        closeChangePasswordDialog()
        await loadUsers(props.token)
      } else {
        showNotification('Failed to change password: ' + result.error, 'error')
      }
    }

    const openDeleteUserDialog = (user) => {
      deleteUserDialog.value = {
        isOpen: true,
        user: user,
        adminPassword: ''
      }
    }

    const closeDeleteUserDialog = () => {
      deleteUserDialog.value.isOpen = false
    }

    const handleConfirmDeleteUser = async () => {
      const { user, adminPassword } = deleteUserDialog.value
      
      if (!adminPassword) {
        showNotification('Admin password is required', 'error')
        return
      }
      
      const result = await deleteUser(props.token, user.user_id)
      if (result.success) {
        showNotification('User deleted successfully!', 'ok')
        closeDeleteUserDialog()
        await loadUsers(props.token)
      } else {
        showNotification('Failed to delete user: ' + result.error, 'error')
      }
    }

    onMounted(() => {
      loadUsers(props.token)
    })

    return {
      users,
      loading,
      error,
      searchQuery,
      expandedUsers,
      editDialog,
      changeRoleDialog,
      changePasswordDialog,
      deleteUserDialog,
      filteredUsers,
      toggleUserFiles,
      handleDeleteUser,
      handleDeleteFile,
      downloadFile,
      openEditDialog,
      closeEditDialog,
      handleSaveUser,
      openChangeRoleDialog,
      closeChangeRoleDialog,
      handleChangeRole,
      openChangePasswordDialog,
      closeChangePasswordDialog,
      handleChangePassword,
      openDeleteUserDialog,
      closeDeleteUserDialog,
      handleConfirmDeleteUser
    }
  }
}
</script>
