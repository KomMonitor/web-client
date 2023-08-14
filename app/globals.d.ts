// extend web browser window object to allow for __env parameter 
// holding KomMonitor related environment parameters / config options 
interface Window {
    gtag: (...args: any[]) => void
    __env: any
  }