import { InjectionToken } from "@angular/core";

export let APP_CONFIG = new InjectionToken<AppConfig>("app.config");

export interface FirebaseConfig {
    apiKey: string,
    authDomain: string,
    databaseURL: string,
    projectId: string,
    storageBucket: string,
    messagingSenderId: string,
    webApplicationId: string
}

export interface AppConfig {
    appName: string;
    apiBase: string;
    googleApiKey: string;
    oneSignalAppId: string;
    oneSignalGPSenderId: string;
    availableLanguages: Array<{ code: string, name: string }>;
    firebaseConfig: FirebaseConfig;
    agoraVideoConfig: { enableAgoraVideo: boolean, agoraAppId: string };
    demoMode: boolean;
}

export const BaseAppConfig: AppConfig = {
    appName: "YourCustomerAppName",
    apiBase: "https://yourapibase.com/",
    googleApiKey: "",
    oneSignalAppId: "",
    oneSignalGPSenderId: "",
    agoraVideoConfig: { enableAgoraVideo: false, agoraAppId: "" },
    availableLanguages: [{
        code: 'en',
        name: 'English'
    }, {
        code: 'ar',
        name: 'Arabic'
    }, {
        code: 'fr',
        name: 'French'
    }, {
        code: 'es',
        name: 'Spanish'
    }, {
        code: 'id',
        name: 'Indonesian'
    }, {
        code: 'pt',
        name: 'Portuguese'
    }, {
        code: 'tr',
        name: 'Turkish'
    }, {
        code: 'it',
        name: 'Italian'
    }, {
        code: 'sw',
        name: 'Swahili'
    }],
    demoMode: false,
    firebaseConfig: {
        webApplicationId: "",
        apiKey: "",
        authDomain: "",
        databaseURL: "",
        projectId: "",
        storageBucket: "",
        messagingSenderId: ""
    }
};