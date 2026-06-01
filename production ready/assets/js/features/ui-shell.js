/*
 * UI shell module ownership:
 * - workspace navigation and views
 * - sidebar, mobile drawer, help modal, and topbar controls
 * - shell animations, status chips, and chrome synchronization
 * - layout-aware UI helpers that are not feature-specific
 */

export const UI_SHELL_SCOPE = [
    'buildWorkspaceViews',
    'syncWorkspaceViewUi',
    'setWorkspaceView',
    'navigateToWorkspaceView',
    'setApiPanelOpen',
    'openHelpModal',
    'closeHelpModal',
    'syncSidebarUi'
];
