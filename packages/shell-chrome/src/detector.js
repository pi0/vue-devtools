import { installToast } from '@back/toast'
import { isFirefox } from '@utils/env'

window.addEventListener('message', e => {
  if (e.source === window && e.data.vueDetected) {
    chrome.runtime.sendMessage(e.data)
  }
})

function detect (win) {
  setTimeout(() => {
    // Method 1: Check Nuxt.js
    const nuxtDetected = Boolean(window.__NUXT__ || window.$nuxt)

    if (nuxtDetected) {
      let Vue

      if (window.$nuxt) {
        Vue = window.$nuxt.$root.constructor
        // -----------------------
        Vue.config.devtools = true
        window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = Vue
        if (window.$nuxt.$store) {
          window.__VUE_DEVTOOLS_GLOBAL_HOOK__.emit('vuex:init', window.$nuxt.$store)
        }
        // -----------------------
      }

      win.postMessage({
        devtoolsEnabled: Vue && Vue.config.devtools,
        vueDetected: true,
        nuxtDetected: true
      }, '*')

      return
    }

    // Method 2: Scan all elements inside document
    const all = document.querySelectorAll('*')
    let el
    for (let i = 0; i < all.length; i++) {
      if (all[i].__vue__) {
        el = all[i]
        break
      }
    }
    if (el) {
      let Vue = Object.getPrototypeOf(el.__vue__).constructor
      while (Vue.super) {
        Vue = Vue.super
      }
      // -----------------------
      Vue.config.devtools = true
      window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue = Vue
      if (el.__vue__.$store) {
        window.__VUE_DEVTOOLS_GLOBAL_HOOK__.emit('vuex:init', el.__vue__.$store)
      }
      // -----------------------
      win.postMessage({
        devtoolsEnabled: Vue.config.devtools,
        vueDetected: true
      }, '*')
    }
  }, 100)
}

// inject the hook
if (document instanceof HTMLDocument) {
  installScript(detect)
  installScript(installToast)
}

function installScript (fn) {
  const source = ';(' + fn.toString() + ')(window)'

  if (isFirefox) {
    // eslint-disable-next-line no-eval
    window.eval(source) // in Firefox, this evaluates on the content window
  } else {
    const script = document.createElement('script')
    script.textContent = source
    document.documentElement.appendChild(script)
    script.parentNode.removeChild(script)
  }
}
