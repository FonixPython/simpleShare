import { ref } from 'vue'

export function useAdmin() {
  const users = ref([])
  const allFiles = ref([])
  const globalStorage = ref({
    totalUsers: 0,
    totalFiles: 0,
    totalStorage: 0,
    totalStorageFormatted: '0 B'
  })
  const databaseTables = ref([])
  const currentTable = ref('')
  const tableData = ref([])
  const loading = ref(false)
  const error = ref('')

  const formatBytes = (bytes) => {
    if (bytes === 0 || bytes === null || bytes === undefined) return "0 B"
    const units = ["B", "kB", "MB", "GB", "TB"]
    const threshold = 1024
    let unitIndex = 0
    let size = Number(bytes)

    while (size >= threshold && unitIndex < units.length - 1) {
      size /= threshold
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }

  const verifyAdminAccess = async (token) => {
    try {
      const response = await fetch("/verifySession", {
        method: "GET",
        headers: {
          "Authorization": token,
        },
      })

      if (!response.ok) {
        throw new Error("Authentication failed")
      }

      const data = await response.json()
      if (data.permission !== "admin") {
        throw new Error("Not an admin")
      }

      return true
    } catch (error) {
      console.error("Admin verification failed:", error)
      return false
    }
  }

  const loadUsers = async (token) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch("/admin/getAllUsersWithFiles", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load users")
      }

      const data = await response.json()
      users.value = data.map(user => {
        // Calculate used storage from user's files
        const usedStorage = user.files.reduce((total, file) => total + (file.size || 0), 0)
        
        return {
          ...user,
          quotaFormatted: formatBytes(user.quota),
          usedFormatted: formatBytes(usedStorage),
          files: user.files.map(file => ({
            ...file,
            sizeFormatted: formatBytes(file.size),
            dateFormatted: new Date(file.date).toLocaleDateString("hu-HU", {
              year: "2-digit",
              month: "2-digit",
              day: "2-digit",
            }) + " " + new Date(file.date).toLocaleTimeString("hu-HU", {
              hour: "2-digit",
              minute: "2-digit",
            })
          }))
        }
      })
    } catch (error) {
      error.value = error.message
    } finally {
      loading.value = false
    }
  }

  const loadAllFiles = async (token) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch("/admin/getAllFiles", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load files")
      }

      const data = await response.json()
      allFiles.value = data.map(file => ({
        ...file,
        sizeFormatted: formatBytes(file.size),
        dateFormatted: new Date(file.date).toLocaleDateString("hu-HU", {
          year: "2-digit",
          month: "2-digit",
          day: "2-digit",
        }) + " " + new Date(file.date).toLocaleTimeString("hu-HU", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        type: file.type || 'file' // Default to 'file' if not specified
      }))
    } catch (error) {
      error.value = error.message
    } finally {
      loading.value = false
    }
  }

  const loadGlobalStorage = async (token) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch("/admin/getGlobalStorage", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load global storage")
      }

      const data = await response.json()
      globalStorage.value = {
        totalUsers: Number(data.totalUsers) || 0,
        totalFiles: Number(data.totalFiles) || 0,
        totalStorage: Number(data.totalStorage) || 0,
        totalStorageFormatted: formatBytes(Number(data.totalStorage) || 0),
        limit: Number(data.limit) || 0,
        used: Number(data.used) || 0,
        remaining: data.remaining,
        percentage: Number(data.percentage) || 0
      }
    } catch (error) {
      error.value = error.message
    } finally {
      loading.value = false
    }
  }

  const loadTables = async (token) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch("/admin/getTables", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load tables")
      }

      const data = await response.json()
      databaseTables.value = data.tables || []
    } catch (error) {
      error.value = error.message
    } finally {
      loading.value = false
    }
  }

  const loadTableData = async (token, tableName) => {
    if (!tableName) return
    
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/admin/getTableData/${tableName}`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load table data")
      }

      const data = await response.json()
      tableData.value = data.data || []
    } catch (error) {
      error.value = error.message
    } finally {
      loading.value = false
    }
  }

  const saveTableData = async (token, tableName, data) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/admin/saveTableData/${tableName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Authorization: token
        },
        body: JSON.stringify({ data })
      })

      if (!response.ok) {
        throw new Error("Failed to save table data")
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const deleteTableRow = async (token, tableName, rowId) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/admin/deleteTableRow/${tableName}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Authorization: token
        },
        body: JSON.stringify({ id: rowId })
      })

      if (!response.ok) {
        throw new Error("Failed to delete row")
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

    const deleteUser = async (token, userId) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch('/admin/user/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ userId })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete user')
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const deleteFile = async (token, fileCode) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/admin/deleteFile/${fileCode}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token
        }
      })

      if (!response.ok) {
        throw new Error('Failed to delete file')
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const getStorageSettings = async (token) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch("/admin/getStorageSettings", {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error("Failed to load storage settings")
      }

      const data = await response.json()
      return {
        globalStorageLimit: data.globalStorageLimit || 0,
        totalStorageUsed: data.totalStorageUsed || 0,
        totalUsers: data.totalUsers || 0,
        totalFiles: data.totalFiles || 0,
        remainingStorage: data.remainingStorage,
        usagePercentage: data.usagePercentage || 0
      }
    } catch (error) {
      error.value = error.message
      return null
    } finally {
      loading.value = false
    }
  }

  const updateStorageLimit = async (token, newLimit) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch('/admin/updateStorageLimit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ limit: newLimit })
      })

      if (!response.ok) {
        throw new Error('Failed to update storage limit')
      }

      const data = await response.json()
      return { success: true, message: data.message }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const changeUserPassword = async (token, userId, newPassword) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch('/admin/user/changePassword', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ userId, newPassword })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change password')
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const changeUsername = async (token, userId, newUsername) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch('/admin/user/changeUsername', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ userId, newUsername })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change username')
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const changeUserQuota = async (token, userId, newQuota) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch('/admin/user/changeQuota', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ userId, newQuota })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change quota')
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const changeUserAdminStatus = async (token, userId, isAdmin) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch('/admin/user/changeAdminStatus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token
        },
        body: JSON.stringify({ userId, isAdmin })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change admin status')
      }

      return { success: true }
    } catch (error) {
      error.value = error.message
      return { success: false, error: error.message }
    } finally {
      loading.value = false
    }
  }

  const getGroupDetails = async (token, groupCode) => {
    loading.value = true
    error.value = ''
    
    try {
      const response = await fetch(`/admin/getGroupDetails/${groupCode}`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          Authorization: token
        }
      })

      if (!response.ok) {
        throw new Error('Failed to load group details')
      }

      const data = await response.json()
      return {
        ...data,
        files: data.files ? data.files.map(file => ({
          ...file,
          sizeFormatted: formatBytes(file.size),
          dateFormatted: new Date(file.date).toLocaleDateString('hu-HU', {
            year: '2-digit',
            month: '2-digit',
            day: '2-digit',
          }) + ' ' + new Date(file.date).toLocaleTimeString('hu-HU', {
            hour: '2-digit',
            minute: '2-digit',
          })
        })) : [],
        sizeFormatted: formatBytes(data.files ? data.files.reduce((total, file) => total + (file.size || 0), 0) : 0),
        dateFormatted: new Date(data.date).toLocaleDateString('hu-HU', {
          year: '2-digit',
          month: '2-digit',
          day: '2-digit',
        }) + ' ' + new Date(data.date).toLocaleTimeString('hu-HU', {
          hour: '2-digit',
          minute: '2-digit',
        })
      }
    } catch (error) {
      error.value = error.message
      return null
    } finally {
      loading.value = false
    }
  }

  return {
    users,
    allFiles,
    globalStorage,
    databaseTables,
    currentTable,
    tableData,
    loading,
    error,
    formatBytes,
    verifyAdminAccess,
    loadUsers,
    loadAllFiles,
    loadGlobalStorage,
    loadTables,
    loadTableData,
    saveTableData,
    deleteTableRow,
    deleteUser,
    deleteFile,
    getStorageSettings,
    updateStorageLimit,
    changeUserPassword,
    changeUsername,
    changeUserQuota,
    changeUserAdminStatus,
    getGroupDetails
  }
}
