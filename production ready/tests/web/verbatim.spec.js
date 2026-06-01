import { test, expect } from '@playwright/test';

const validWorkspace = {
    version: 4,
    savedAt: '2026-05-17T00:00:00.000Z',
    mode: 'file',
    captureSource: 'mic',
    preset: 'dictation',
    transcript: 'Imported smoke transcript',
    aiOutput: '',
    segments: [{ text: 'Imported smoke transcript', start: 0, end: 1 }],
    detectedLanguage: 'en',
    speakerMode: false,
    translation: {
        enabled: false,
        targetLanguage: 'en',
        segmentResults: {}
    }
};

const responsiveViewports = [
    { name: 'small-phone', width: 320, height: 568 },
    { name: 'phone', width: 360, height: 800 },
    { name: 'large-phone', width: 412, height: 915 },
    { name: 'phone-landscape', width: 667, height: 375 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'desktop', width: 1366, height: 768 },
    { name: 'wide-desktop', width: 1920, height: 1080 }
];

async function loadWorkspace(page, viewport) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await page.goto('/');
    await page.locator('#workspaceStatus').waitFor({ state: 'attached' });
    await expect(page.locator('#mainContent')).toContainText('Recording workspace');
}

async function expectNoDocumentHorizontalOverflow(page, label) {
    const metrics = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyClientWidth: document.body.clientWidth,
        bodyScrollWidth: document.body.scrollWidth
    }));
    expect(metrics.scrollWidth, `${label} document overflow: ${JSON.stringify(metrics)}`)
        .toBeLessThanOrEqual(metrics.clientWidth + 1);
    expect(metrics.bodyScrollWidth, `${label} body overflow: ${JSON.stringify(metrics)}`)
        .toBeLessThanOrEqual(metrics.bodyClientWidth + 1);
}

async function expectVisibleContentWithinViewport(page, label) {
    const offenders = await page.evaluate(() => {
        const viewportWidth = document.documentElement.clientWidth;
        const selector = [
            'button',
            '[role="button"]',
            'input',
            'select',
            'textarea',
            '.workspace-view-head',
            '.rec-panel',
            '.transcript-panel',
            '.translation-panel',
            '.utility-card',
            '.api-panel.open',
            '.assistant-shell.open .assistant-panel'
        ].join(',');

        const isRendered = (el) => {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            if (el.hidden || el.closest('[hidden]')) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && el.getClientRects().length > 0;
        };

        return Array.from(document.querySelectorAll(selector))
            .filter(isRendered)
            .filter((el) => {
                if (el.closest('.workspace-left-rail.sidebar') && !document.body.classList.contains('sidebar-mobile-open')) return false;
                if (el.closest('.topbar-mobile-drawer') && !el.closest('.topbar-mobile-drawer.open')) return false;
                if (el.closest('.assistant-panel') && !document.querySelector('#assistantShell')?.classList.contains('open')) return false;
                return true;
            })
            .map((el) => {
                const rect = el.getBoundingClientRect();
                return {
                    tag: el.tagName.toLowerCase(),
                    id: el.id || null,
                    className: typeof el.className === 'string' ? el.className : null,
                    left: Math.round(rect.left),
                    right: Math.round(rect.right),
                    width: Math.round(rect.width)
                };
            })
            .filter((item) => item.left < -1 || item.right > viewportWidth + 1)
            .slice(0, 12);
    });

    expect(offenders, `${label} visible horizontal offenders`).toEqual([]);
}

async function expectCoreTouchTargets(page, selectors, label) {
    const issues = await page.evaluate((targetSelectors) => {
        const isRendered = (el) => {
            const style = window.getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0') return false;
            if (el.disabled || el.hidden || el.closest('[hidden]')) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0 && el.getClientRects().length > 0;
        };

        return targetSelectors.flatMap((selector) => Array.from(document.querySelectorAll(selector)).map((el) => {
            if (!isRendered(el)) return null;
            const rect = el.getBoundingClientRect();
            return {
                selector,
                id: el.id || null,
                className: typeof el.className === 'string' ? el.className : null,
                width: Math.round(rect.width),
                height: Math.round(rect.height)
            };
        }).filter(Boolean))
            .filter((item) => item.width < 44 || item.height < 44);
    }, selectors);

    expect(issues, `${label} touch targets below 44px`).toEqual([]);
}

async function waitForSidebarSettled(page, expectedOpen) {
    await page.waitForFunction((open) => {
        const sidebar = document.querySelector('.workspace-left-rail.sidebar');
        if (!sidebar) return false;
        const rect = sidebar.getBoundingClientRect();
        const bodyOpen = document.body.classList.contains('sidebar-mobile-open');
        return open
            ? bodyOpen && rect.left >= -1
            : !bodyOpen && rect.right <= 1;
    }, expectedOpen, { timeout: 3000 });
}

async function selectWorkspaceView(page, view, viewport) {
    const navButton = page.locator(`.workspace-nav-btn[data-view="${view}"]`);
    if (viewport.width <= 767) {
        await page.locator('#workspaceSidebarBtn').click();
        await expect(page.locator('body')).toHaveClass(/sidebar-mobile-open/);
        await waitForSidebarSettled(page, true);
        await navButton.evaluate((el) => el.scrollIntoView({ block: 'center', inline: 'nearest' }));
        await navButton.click({ force: true });
        await expect(page.locator('body')).not.toHaveClass(/sidebar-mobile-open/);
        await waitForSidebarSettled(page, false);
        return;
    }
    await navButton.click();
}

test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
        localStorage.clear();
        sessionStorage.clear();
    });
    await page.goto('/');
    await page.locator('#workspaceStatus').waitFor({ state: 'attached' });
    await expect(page.locator('#mainContent')).toContainText('Recording workspace');
});

test('boots the static workspace and navigates between core views', async ({ page }) => {
    await expect(page.locator('#mainContent')).toContainText('Recording workspace');
    await page.getByRole('button', { name: 'Transcript' }).click();
    await expect(page.locator('[data-workspace-view="transcript"]')).toBeVisible();
    await page.locator('.workspace-nav-btn[data-view="tools"]').click();
    await expect(page.locator('[data-workspace-view="tools"]')).toBeVisible();
});

test('rejects invalid workspace imports without restoring partial state', async ({ page }) => {
    await page.locator('#workspaceFileInput').setInputFiles({
        name: 'bad-workspace.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify({ version: 999, transcript: 'must not restore' }))
    });

    await expect(page.locator('.toast-container')).toContainText('Unsupported workspace version');
    await expect(page.locator('#workspaceStatus')).not.toContainText('Restored');
    await expect(page.locator('#transcript')).not.toHaveValue(/must not restore/);
});

test('imports a valid workspace after validation', async ({ page }) => {
    await page.locator('#workspaceFileInput').setInputFiles({
        name: 'workspace.json',
        mimeType: 'application/json',
        buffer: Buffer.from(JSON.stringify(validWorkspace))
    });

    await expect(page.locator('#workspaceStatus')).toContainText('Restored');
    await expect(page.locator('#transcript')).toHaveValue(/Imported smoke transcript/);
});

test('surfaces provider timeout errors during API testing', async ({ page }) => {
    await page.route('**/openai/v1/audio/transcriptions', async () => {
        await new Promise(resolve => setTimeout(resolve, 2000));
    });
    await page.evaluate(() => {
        window.__VERBATIM_PROVIDER_TIMEOUT_MS__ = 50;
    });

    await page.locator('#apiHeader').click();
    await page.locator('#apiKeyInput').fill('timeout-test-key');
    await page.locator('#apiKeySave').click();
    await page.locator('#apiKeyTest').click();

    await expect(page.locator('.toast-container')).toContainText('timed out');
    await expect(page.locator('#apiStatusLabel')).toHaveText('Error');
});

test('keeps responsive layouts contained across supported viewport matrix', async ({ page }) => {
    test.setTimeout(120000);

    for (const viewport of responsiveViewports) {
        await loadWorkspace(page, viewport);
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} initial`);
        await expectVisibleContentWithinViewport(page, `${viewport.name} initial`);

        if (viewport.width <= 767) {
            await page.locator('#workspaceSidebarBtn').click();
            await expect(page.locator('body')).toHaveClass(/sidebar-mobile-open/);
            await waitForSidebarSettled(page, true);
            await expectNoDocumentHorizontalOverflow(page, `${viewport.name} sidebar open`);
            await expectVisibleContentWithinViewport(page, `${viewport.name} sidebar open`);
            await page.mouse.click(viewport.width - 6, Math.floor(viewport.height / 2));
            await expect(page.locator('body')).not.toHaveClass(/sidebar-mobile-open/);
            await waitForSidebarSettled(page, false);

            await page.locator('#topbarControlsBtn').click();
            await expect(page.locator('#topbarMobileDrawer')).toHaveClass(/open/);
            await expectNoDocumentHorizontalOverflow(page, `${viewport.name} controls drawer`);
            await expectVisibleContentWithinViewport(page, `${viewport.name} controls drawer`);
            await page.mouse.click(viewport.width - 4, viewport.height - 4);
            await expect(page.locator('#topbarMobileDrawer')).not.toHaveClass(/open/);
        }

        await page.locator('#apiHeader').click();
        await expect(page.locator('#apiPanel')).toHaveClass(/open/);
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} api panel`);
        await expectVisibleContentWithinViewport(page, `${viewport.name} api panel`);
        await page.locator('#apiHeader').click();

        await selectWorkspaceView(page, 'transcript', viewport);
        await expect(page.locator('[data-workspace-view="transcript"]')).toBeVisible();
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} transcript`);
        await page.locator('#transcript').focus();
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} transcript focus`);

        await selectWorkspaceView(page, 'translation', viewport);
        await expect(page.locator('[data-workspace-view="translation"]')).toBeVisible();
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} translation`);

        await selectWorkspaceView(page, 'tools', viewport);
        await expect(page.locator('[data-workspace-view="tools"]')).toBeVisible();
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} export`);
        await expectVisibleContentWithinViewport(page, `${viewport.name} export`);
    }
});

test('mobile drawers, assistant, and primary controls meet touch requirements', async ({ page }) => {
    test.setTimeout(120000);

    for (const viewport of responsiveViewports.filter((item) => item.width <= 767)) {
        await loadWorkspace(page, viewport);

        await expectCoreTouchTargets(page, [
            '#workspaceSidebarBtn',
            '#topbarControlsBtn',
            '#modeRealtime',
            '#modeQuality',
            '#modeFile',
            '#apiHeader',
            '#copyBtn',
            '#historyBtn',
            '#clearBtn',
            '#assistantLauncher'
        ], `${viewport.name} core controls`);

        await page.locator('#workspaceSidebarBtn').click();
        await expect(page.locator('body')).toHaveClass(/sidebar-mobile-open/);
        await waitForSidebarSettled(page, true);
        await expectCoreTouchTargets(page, [
            '.workspace-nav-btn.nav-item',
            '#workspaceSidebarCloseBtn',
            '#workspaceSidebarCollapseBtn'
        ], `${viewport.name} sidebar controls`);
        await page.mouse.click(viewport.width - 6, Math.floor(viewport.height / 2));
        await waitForSidebarSettled(page, false);

        await page.locator('#topbarControlsBtn').click();
        await expect(page.locator('#topbarMobileDrawer')).toHaveClass(/open/);
        await expectCoreTouchTargets(page, [
            '#topbarMobileDrawer select',
            '#topbarMobileDrawer button'
        ], `${viewport.name} topbar drawer controls`);
        await page.mouse.click(viewport.width - 4, viewport.height - 4);

        await page.locator('#assistantLauncher').click();
        await expect(page.locator('#assistantShell')).toHaveClass(/open/);
        await expect(page.locator('#assistantPanel')).toBeVisible();
        await page.locator('#assistantInput').focus();
        await expectCoreTouchTargets(page, [
            '#assistantCloseBtn',
            '#assistantAttachBtn',
            '#assistantMicBtn',
            '#assistantSend',
            '.assistant-icon-btn'
        ], `${viewport.name} assistant controls`);
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} assistant focus`);
        await expectVisibleContentWithinViewport(page, `${viewport.name} assistant focus`);
    }
});
