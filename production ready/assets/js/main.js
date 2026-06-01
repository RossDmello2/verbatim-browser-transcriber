import { runtimeCapabilities, renderUnsupportedBrowser } from './runtime/capabilities.js';
import { buildApp } from './app/build-app.js';
if (!runtimeCapabilities.canBoot) {
    renderUnsupportedBrowser();
} else {
    buildApp();
}
