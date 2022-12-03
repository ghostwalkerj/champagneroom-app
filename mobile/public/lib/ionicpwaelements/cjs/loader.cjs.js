'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const index = require('./index-5d6851b1.js');
const patch = require('./patch-c258dbcd.js');

const defineCustomElements = (win, options) => {
  if (typeof window === 'undefined') return Promise.resolve();
  return patch.patchEsm().then(() => {
  return index.bootstrapLazy([["pwa-camera-modal.cjs",[[1,"pwa-camera-modal",{"facingMode":[1,"facing-mode"],"present":[64],"dismiss":[64]}]]],["pwa-action-sheet.cjs",[[1,"pwa-action-sheet",{"header":[1],"cancelable":[4],"options":[16],"open":[32]}]]],["pwa-toast.cjs",[[1,"pwa-toast",{"message":[1],"duration":[2],"closing":[32]}]]],["pwa-camera.cjs",[[1,"pwa-camera",{"facingMode":[1,"facing-mode"],"handlePhoto":[16],"handleNoDeviceError":[16],"noDevicesText":[1,"no-devices-text"],"noDevicesButtonText":[1,"no-devices-button-text"],"photo":[32],"photoSrc":[32],"showShutterOverlay":[32],"flashIndex":[32],"hasCamera":[32],"rotation":[32],"deviceError":[32]}]]],["pwa-camera-modal-instance.cjs",[[1,"pwa-camera-modal-instance",{"facingMode":[1,"facing-mode"],"noDevicesText":[1,"no-devices-text"],"noDevicesButtonText":[1,"no-devices-button-text"]},[[32,"keyup","handleBackdropKeyUp"]]]]]], options);
  });
};

exports.defineCustomElements = defineCustomElements;
