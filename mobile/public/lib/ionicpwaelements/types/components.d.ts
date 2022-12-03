/* eslint-disable */
/* tslint:disable */
/**
 * This is an autogenerated file created by the Stencil compiler.
 * It contains typing information for all components that exist in this project.
 */
import { HTMLStencilElement, JSXBase } from "./stencil-public-runtime";
import { ActionSheetOption } from "./definitions";
export namespace Components {
    interface PwaActionSheet {
        "cancelable": boolean;
        "header": string;
        "options": ActionSheetOption[];
    }
    interface PwaCamera {
        "facingMode": string;
        "handleNoDeviceError": (e?: any) => void;
        "handlePhoto": (photo: Blob) => void;
        "noDevicesButtonText": string;
        "noDevicesText": string;
    }
    interface PwaCameraModal {
        "dismiss": () => Promise<void>;
        "facingMode": string;
        "present": () => Promise<void>;
    }
    interface PwaCameraModalInstance {
        "facingMode": string;
        "noDevicesButtonText": string;
        "noDevicesText": string;
    }
    interface PwaToast {
        "duration": number;
        "message": string;
    }
}
declare global {
    interface HTMLPwaActionSheetElement extends Components.PwaActionSheet, HTMLStencilElement {
    }
    var HTMLPwaActionSheetElement: {
        prototype: HTMLPwaActionSheetElement;
        new (): HTMLPwaActionSheetElement;
    };
    interface HTMLPwaCameraElement extends Components.PwaCamera, HTMLStencilElement {
    }
    var HTMLPwaCameraElement: {
        prototype: HTMLPwaCameraElement;
        new (): HTMLPwaCameraElement;
    };
    interface HTMLPwaCameraModalElement extends Components.PwaCameraModal, HTMLStencilElement {
    }
    var HTMLPwaCameraModalElement: {
        prototype: HTMLPwaCameraModalElement;
        new (): HTMLPwaCameraModalElement;
    };
    interface HTMLPwaCameraModalInstanceElement extends Components.PwaCameraModalInstance, HTMLStencilElement {
    }
    var HTMLPwaCameraModalInstanceElement: {
        prototype: HTMLPwaCameraModalInstanceElement;
        new (): HTMLPwaCameraModalInstanceElement;
    };
    interface HTMLPwaToastElement extends Components.PwaToast, HTMLStencilElement {
    }
    var HTMLPwaToastElement: {
        prototype: HTMLPwaToastElement;
        new (): HTMLPwaToastElement;
    };
    interface HTMLElementTagNameMap {
        "pwa-action-sheet": HTMLPwaActionSheetElement;
        "pwa-camera": HTMLPwaCameraElement;
        "pwa-camera-modal": HTMLPwaCameraModalElement;
        "pwa-camera-modal-instance": HTMLPwaCameraModalInstanceElement;
        "pwa-toast": HTMLPwaToastElement;
    }
}
declare namespace LocalJSX {
    interface PwaActionSheet {
        "cancelable"?: boolean;
        "header"?: string;
        "onOnSelection"?: (event: CustomEvent<any>) => void;
        "options"?: ActionSheetOption[];
    }
    interface PwaCamera {
        "facingMode"?: string;
        "handleNoDeviceError"?: (e?: any) => void;
        "handlePhoto"?: (photo: Blob) => void;
        "noDevicesButtonText"?: string;
        "noDevicesText"?: string;
    }
    interface PwaCameraModal {
        "facingMode"?: string;
        "onNoDeviceError"?: (event: CustomEvent<any>) => void;
        "onOnPhoto"?: (event: CustomEvent<any>) => void;
    }
    interface PwaCameraModalInstance {
        "facingMode"?: string;
        "noDevicesButtonText"?: string;
        "noDevicesText"?: string;
        "onNoDeviceError"?: (event: CustomEvent<any>) => void;
        "onOnPhoto"?: (event: CustomEvent<any>) => void;
    }
    interface PwaToast {
        "duration"?: number;
        "message"?: string;
    }
    interface IntrinsicElements {
        "pwa-action-sheet": PwaActionSheet;
        "pwa-camera": PwaCamera;
        "pwa-camera-modal": PwaCameraModal;
        "pwa-camera-modal-instance": PwaCameraModalInstance;
        "pwa-toast": PwaToast;
    }
}
export { LocalJSX as JSX };
declare module "@stencil/core" {
    export namespace JSX {
        interface IntrinsicElements {
            "pwa-action-sheet": LocalJSX.PwaActionSheet & JSXBase.HTMLAttributes<HTMLPwaActionSheetElement>;
            "pwa-camera": LocalJSX.PwaCamera & JSXBase.HTMLAttributes<HTMLPwaCameraElement>;
            "pwa-camera-modal": LocalJSX.PwaCameraModal & JSXBase.HTMLAttributes<HTMLPwaCameraModalElement>;
            "pwa-camera-modal-instance": LocalJSX.PwaCameraModalInstance & JSXBase.HTMLAttributes<HTMLPwaCameraModalInstanceElement>;
            "pwa-toast": LocalJSX.PwaToast & JSXBase.HTMLAttributes<HTMLPwaToastElement>;
        }
    }
}
