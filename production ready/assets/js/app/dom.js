/*
 * Owns the DOM access pattern for the production package.
 * The runtime still injects most UI inside buildApp(), so this file documents
 * the shared lookup style beginners will see throughout the app.
 */

export function getById(id) {
    return document.getElementById(id);
}

export function query(selector, root = document) {
    return root.querySelector(selector);
}

export function queryAll(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
}

export const DOM_GUIDE = [
    'HTML shell is small; most UI is injected at runtime into #mainContent',
    'IDs are runtime contracts and should stay stable across refactors',
    'Feature modules generally bind events after buildApp() injects the UI'
];
