// Camera
export {
  capturePhoto,
  pickFromGallery,
  checkCameraPermissions,
  requestCameraPermissions,
  type CapturedPhoto,
} from "./camera";

// Storage
export {
  setItem,
  getItem,
  removeItem,
  clearStorage,
  getAllKeys,
  setJSON,
  getJSON,
  saveFile,
  saveBase64File,
  readFile,
  readBase64File,
  deleteFile,
  fileExists,
  createDirectory,
  listDirectory,
  saveInspectionPhoto,
  getInspectionPhoto,
  deleteInspectionPhoto,
  listInspectionPhotos,
  addToOfflineQueue,
  getOfflineQueue,
  removeFromOfflineQueue,
  clearOfflineQueue,
  saveDraft,
  getDraft,
  getDrafts,
  deleteDraft,
  Directory,
  type OfflineAction,
  type InspectionDraft,
  type SavedFile,
} from "./storage";

// Geolocation
export {
  getCurrentLocation,
  watchLocation,
  stopWatchingLocation,
  checkLocationPermissions,
  requestLocationPermissions,
  calculateDistance,
  calculateDistanceMiles,
  geocodeAddress,
  reverseGeocode,
  type LocationResult,
  type Coordinates,
} from "./geolocation";

// Network
export {
  getNetworkStatus,
  addNetworkListener,
  checkConnectivity,
  waitForConnection,
  type NetworkState,
  type ConnectionType,
} from "./network";

// Haptics
export {
  impactLight,
  impactMedium,
  impactHeavy,
  notificationSuccess,
  notificationWarning,
  notificationError,
  vibrate,
  selectionStart,
  selectionChanged,
  selectionEnd,
} from "./haptics";

// App State
export {
  addAppStateListener,
  getAppInfo,
  addBackButtonListener,
  addUrlOpenListener,
  setStatusBarStyle,
  hideStatusBar,
  showStatusBar,
  setStatusBarColor,
  hideSplashScreen,
  showSplashScreen,
  addKeyboardListener,
  hideKeyboard,
  showKeyboard,
} from "./app-state";
