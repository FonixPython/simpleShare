<template>
  <div
    v-if="visible"
    class="flex justify-center items-center w-full h-full absolute top-0 left-0 bg-transparent background z-[50]"
    @click="$emit('close')"
  >
    <div
      class="z-[75] bg-black/20 backdrop-blur-[20px] absolute h-[calc(100vh-20vh)] mobile:h-[calc(100vh-10vh)] w-[calc(100vw-30vw)] mobile:w-[calc(100vw-5vw)] flex items-center justify-center flex-col m-[100px_auto] mobile:m-[50px_auto] mobile:mx-4 rounded-[28px] mobile:rounded-[20px] border-3 border-[#a1a1a1] transition-all duration-300 modal animate-scale-in"
      @click.stop
    >
      <button
        class="absolute top-5 mobile:top-3 h-[42px] mobile:h-[36px] right-5 mobile:right-3 bg-primary-button text-black border-none px-[10px] mobile:px-[8px] py-[10px] mobile:py-[8px] rounded-lg text-lg mobile:text-base cursor-pointer tracking-[1px] text-center z-[70] close-btn transition-all duration-200 hover:scale-110 hover:shadow-lg hover:shadow-primary-button/50"
        @click="$emit('close')"
      >
        <span class="material-icons-outlined mobile:text-sm">close</span>
      </button>

      <h2 class="text-2xl mobile:text-xl font-inter font-semibold text-white mb-6 mobile:mb-4">
        Share Link
      </h2>

      <!-- Input Section -->
      <div
        v-if="!linkCreated && !loading"
        class="w-[80%] mobile:w-[90%] flex flex-col items-center space-y-4 mobile:space-y-3"
      >
        <div class="w-full">
          <label class="text-sm mobile:text-xs text-gray-400 mb-2 block">URL to share</label>
          <input
            v-model="url"
            type="url"
            placeholder="https://example.com"
            class="w-full p-4 mobile:p-3 bg-black/20 border border-[#444] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-primary-button transition-all duration-200"
            @keyup.enter="createLink"
          />
        </div>

        <button
          class="flex items-center gap-2 px-6 mobile:px-5 py-3 mobile:py-2.5 bg-primary-button text-black rounded-lg font-medium text-base mobile:text-sm hover:scale-105 transition-all duration-200 hover:shadow-lg hover:shadow-primary-button/50 disabled:opacity-50 disabled:cursor-not-allowed"
          :disabled="!isValidUrl"
          @click="createLink"
        >
          <span class="material-icons-outlined">link</span>
          Create Short Link
        </button>

        <p v-if="error" class="text-error text-sm mobile:text-xs mt-2">
          {{ error }}
        </p>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex flex-col items-center space-y-4">
        <div class="w-12 h-12 border-4 border-primary-button border-t-transparent rounded-full animate-spin"></div>
        <p class="text-gray-400 text-sm mobile:text-xs">Creating your short link...</p>
      </div>

      <!-- Success Section -->
      <div
        v-if="linkCreated"
        class="w-[80%] mobile:w-[90%] flex flex-col items-center space-y-6 mobile:space-y-4"
      >
        <div class="text-center">
          <div
            class="inline-flex items-center justify-center w-16 h-16 mobile:w-12 mobile:h-12 rounded-full bg-green-500/20 mb-4"
          >
            <span class="material-icons-outlined text-3xl mobile:text-2xl text-secondary-button">check</span>
          </div>
          <h3 class="text-xl mobile:text-lg font-inter font-semibold text-white mb-2">
            Link created successfully!
          </h3>
        </div>

        <!-- Short Code Display -->
        <div class="text-center">
          <p class="text-gray-400 text-sm mobile:text-xs mb-2">Your short code:</p>
          <div class="flex items-center justify-center gap-3 mobile:gap-2">
            <span
              class="text-3xl mobile:text-2xl font-red-hat font-bold text-primary-button cursor-pointer group relative transition-all duration-200 hover:scale-110 hover:text-secondary-button"
              title="Click to copy"
              @click="copyCode"
            >
              <span
                class="tooltip absolute -top-8 mobile:-top-6 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white text-xs mobile:text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none"
              >
                {{ copyTooltip }}
              </span>
              {{ linkData.id }}
            </span>
          </div>
        </div>

        <!-- Short URL Display -->
        <div class="w-full">
          <p class="text-sm mobile:text-xs text-gray-400 mb-2">Short URL:</p>
          <div
            class="flex items-center gap-3 mobile:gap-2 p-4 mobile:p-3 bg-black/20 rounded-xl border border-[#444]"
          >
            <span
              class="flex-1 font-red-hat text-sm mobile:text-xs truncate cursor-pointer hover:text-primary-button transition-colors"
              @click="copyLink"
            >
              {{ shortUrl }}
            </span>
            <button
              class="p-2 mobile:p-1 rounded-lg hover:bg-black/20 transition-all duration-200 group relative hover:scale-110"
              title="Click to copy"
              @click="copyLink"
            >
              <span
                class="material-icons-outlined text-xl mobile:text-lg text-gray-400 group-hover:text-white cursor-pointer"
                >content_copy</span
              >
            </button>
          </div>
        </div>

        <!-- Original URL Display -->
        <div class="w-full">
          <p class="text-sm mobile:text-xs text-gray-400 mb-2">Original URL:</p>
          <div class="p-3 mobile:p-2 bg-black/10 rounded-lg border border-[#333]">
            <p class="text-xs mobile:text-[10px] text-gray-500 truncate">{{ linkData.url }}</p>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-3 mobile:gap-2">
          <button
            class="flex items-center gap-2 px-5 mobile:px-4 py-2.5 mobile:py-2 bg-gray-700 text-white rounded-lg font-medium text-sm mobile:text-xs hover:bg-gray-600 transition-all duration-200"
            @click="createAnother"
          >
            <span class="material-icons-outlined text-lg mobile:text-sm">add</span>
            Create Another
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: "LinkShareModal",
  props: {
    visible: Boolean,
    token: String,
  },
  emits: ["close", "link-created"],
  data() {
    return {
      url: "",
      loading: false,
      linkCreated: false,
      linkData: null,
      error: null,
      copyTooltip: "Click to copy",
    };
  },
  computed: {
    isValidUrl() {
      if (!this.url) return false;
      try {
        const url = new URL(this.url);
        return url.protocol === "http:" || url.protocol === "https:";
      } catch {
        return false;
      }
    },
    shortUrl() {
      if (this.linkData && this.linkData.id) {
        return window.location.href + this.linkData.id;
      }
      return "";
    },
  },
  watch: {
    visible(newVal) {
      if (!newVal) {
        this.reset();
      }
    },
  },
  methods: {
    async createLink() {
      if (!this.isValidUrl) return;

      this.loading = true;
      this.error = null;

      try {
        const response = await fetch("/share-link", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: this.token,
          },
          body: JSON.stringify({ url: this.url }),
        });

        if (response.ok) {
          const data = await response.json();
          this.linkData = data;
          this.linkCreated = true;
          this.$emit("link-created", data);
        } else {
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            const error = await response.json();
            this.error = error.error || "Failed to create link";
          } else {
            this.error = `Server error: ${response.status}`;
          }
        }
      } catch (err) {
        this.error = "Network error. Please try again.";
        console.error("Error creating link:", err);
      } finally {
        this.loading = false;
      }
    },

    async copyCode() {
      try {
        await navigator.clipboard.writeText(this.linkData.id);
        this.showCopyFeedback("Code copied!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },

    async copyLink() {
      try {
        await navigator.clipboard.writeText(this.shortUrl);
        this.showCopyFeedback("Link copied!");
      } catch (err) {
        console.error("Failed to copy:", err);
      }
    },

    showCopyFeedback(message) {
      this.copyTooltip = message;
      setTimeout(() => {
        this.copyTooltip = "Click to copy";
      }, 2000);
    },

    createAnother() {
      this.reset();
    },

    reset() {
      this.url = "";
      this.loading = false;
      this.linkCreated = false;
      this.linkData = null;
      this.error = null;
      this.copyTooltip = "Click to copy";
    },
  },
};
</script>

<style scoped>
.background {
  background-color: rgba(0, 0, 0, 0.3);
}

.modal {
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

input[type="url"]::-webkit-input-placeholder {
  color: #666;
}

input[type="url"]::-moz-placeholder {
  color: #666;
}

input[type="url"]:-ms-input-placeholder {
  color: #666;
}
</style>
