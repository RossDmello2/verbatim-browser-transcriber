import { runtimeCapabilities, renderUnsupportedBrowser } from './runtime/capabilities.js';
import { buildApp } from './app/build-app.js?v=20260702-2c882bbb';
if (!runtimeCapabilities.canBoot) {
    renderUnsupportedBrowser();
} else {
    buildApp();
}
