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
    { name: 'design-phone', width: 390, height: 844 },
    { name: 'large-phone', width: 412, height: 915 },
    { name: 'phone-landscape', width: 667, height: 375 },
    { name: 'tablet-portrait', width: 768, height: 1024 },
    { name: 'tablet-landscape', width: 1024, height: 768 },
    { name: 'compact-desktop', width: 1280, height: 720 },
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

async function expectActiveViewVerticallyReachable(page, label) {
    const metrics = await page.evaluate(() => {
        const activeView = document.querySelector('.workspace-view.is-active');
        const owner = window.innerWidth <= 767
            ? activeView?.querySelector('.workspace-view-body')
            : document.querySelector('.workspace-view-stage');
        if (!activeView || !owner) return { error: 'active view or scroll owner missing' };

        const isRendered = (el) => {
            const style = getComputedStyle(el);
            if (style.display === 'none' || style.visibility === 'hidden' || el.hidden || el.closest('[hidden]')) return false;
            const rect = el.getBoundingClientRect();
            return rect.width > 0 && rect.height > 0;
        };
        const viewBody = activeView.querySelector('.workspace-view-body');
        const rendered = Array.from(viewBody?.children || []).filter(isRendered);
        const finalChild = rendered.reduce((last, el) => {
            if (!last) return el;
            return el.getBoundingClientRect().bottom >= last.getBoundingClientRect().bottom ? el : last;
        }, null);
        const before = owner.scrollTop;
        const maxScroll = Math.max(0, owner.scrollHeight - owner.clientHeight);
        const previousScrollBehavior = owner.style.scrollBehavior;
        owner.style.scrollBehavior = 'auto';
        owner.scrollTop = maxScroll;
        void owner.offsetHeight;
        const ownerRect = owner.getBoundingClientRect();
        const finalRect = finalChild?.getBoundingClientRect();
        const overflowY = getComputedStyle(owner).overflowY;
        const hiddenAncestors = [];
        let ancestor = finalChild?.parentElement;
        while (ancestor && ancestor !== owner && ancestor !== document.body) {
            const style = getComputedStyle(ancestor);
            if ((style.overflowY === 'hidden' || style.overflow === 'hidden')
                && ancestor.scrollHeight > ancestor.clientHeight + 1) {
                hiddenAncestors.push(ancestor.id || ancestor.className || ancestor.tagName);
            }
            ancestor = ancestor.parentElement;
        }
        const result = {
            overflowY,
            clientHeight: owner.clientHeight,
            scrollHeight: owner.scrollHeight,
            maxScroll,
            reachedBottom: !finalRect || finalRect.bottom <= ownerRect.bottom + 1,
            hiddenAncestors
        };
        owner.scrollTop = before;
        owner.style.scrollBehavior = previousScrollBehavior;
        return result;
    });

    expect(metrics.error, `${label}: ${JSON.stringify(metrics)}`).toBeUndefined();
    if (metrics.scrollHeight > metrics.clientHeight + 1) {
        expect(['auto', 'scroll'], `${label} scroll owner: ${JSON.stringify(metrics)}`).toContain(metrics.overflowY);
        expect(metrics.maxScroll, `${label} operational scroll range: ${JSON.stringify(metrics)}`).toBeGreaterThan(0);
    }
    expect(metrics.reachedBottom, `${label} final child reachability: ${JSON.stringify(metrics)}`).toBe(true);
    expect(metrics.hiddenAncestors, `${label} clipping ancestors`).toEqual([]);
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
        await expectActiveViewVerticallyReachable(page, `${viewport.name} initial`);

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

        if (viewport.width <= 767) {
            await page.locator('#topbarControlsBtn').click();
            await expect(page.locator('#topbarMobileDrawer')).toHaveClass(/open/);
            await page.locator('#apiHeader').evaluate((header) => header.scrollIntoView({ block: 'center' }));
        }
        await page.locator('#apiHeader').click({ force: viewport.width <= 767 });
        await expect(page.locator('#apiPanel')).toHaveClass(/open/);
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} api panel`);
        await expectVisibleContentWithinViewport(page, `${viewport.name} api panel`);
        await page.locator('#apiHeader').click();
        if (viewport.width <= 767) {
            await page.locator('#topbarControlsBtn').evaluate((button) => button.click());
            await expect(page.locator('#topbarMobileDrawer')).not.toHaveClass(/open/);
        }

        await selectWorkspaceView(page, 'transcript', viewport);
        await expect(page.locator('[data-workspace-view="transcript"]')).toBeVisible();
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} transcript`);
        await expectActiveViewVerticallyReachable(page, `${viewport.name} transcript`);
        await page.locator('#transcript').focus();
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} transcript focus`);

        await selectWorkspaceView(page, 'voice', viewport);
        await expect(page.locator('[data-workspace-view="voice"]')).toBeVisible();
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} voice`);
        await expectVisibleContentWithinViewport(page, `${viewport.name} voice`);
        await expectActiveViewVerticallyReachable(page, `${viewport.name} voice`);

        await selectWorkspaceView(page, 'translation', viewport);
        await expect(page.locator('[data-workspace-view="translation"]')).toBeVisible();
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} translation`);
        await expectActiveViewVerticallyReachable(page, `${viewport.name} translation`);

        await selectWorkspaceView(page, 'tools', viewport);
        await expect(page.locator('[data-workspace-view="tools"]')).toBeVisible();
        await expectNoDocumentHorizontalOverflow(page, `${viewport.name} export`);
        await expectVisibleContentWithinViewport(page, `${viewport.name} export`);
        await expectActiveViewVerticallyReachable(page, `${viewport.name} export`);
    }
});

test('desktop workspace alignment remains stable at target viewports', async ({ page }) => {
    test.setTimeout(120000);
    const targets = [
        { name: 'wide-desktop', width: 1920, height: 1080 },
        { name: 'desktop', width: 1366, height: 768 },
        { name: 'compact-desktop', width: 1280, height: 720 }
    ];

    for (const viewport of targets) {
        await loadWorkspace(page, viewport);
        await selectWorkspaceView(page, 'voice', viewport);
        await page.waitForTimeout(350);

        const voiceMetrics = await page.evaluate(() => {
            const rect = (selector) => {
                const value = document.querySelector(selector)?.getBoundingClientRect();
                return value && {
                    left: value.left,
                    right: value.right,
                    top: value.top,
                    bottom: value.bottom,
                    width: value.width,
                    height: value.height
                };
            };
            const stage = rect('.workspace-view-stage');
            const content = [
                rect('.voice-primary-column'),
                rect('.voice-context-column')
            ].filter(Boolean);
            const api = rect('#apiHeader');
            const topbarControls = Array.from(document.querySelectorAll(
                '.topbar-secondary-controls .lang-wrap, .topbar-secondary-controls .toggle-btn'
            )).filter((el) => getComputedStyle(el).display !== 'none').map((el) => {
                const box = el.getBoundingClientRect();
                return {
                    left: box.left,
                    right: box.right,
                    top: box.top,
                    bottom: box.bottom,
                    clipped: el.scrollWidth > el.clientWidth + 1
                };
            });
            const intersects = (a, b) => a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top;
            return {
                stage,
                contentBottom: Math.max(...content.map((item) => item.bottom)),
                requiredCardsVisible: [
                    '.voice-prime-card',
                    '.voice-memory-card',
                    '.voice-transcript-card'
                ].every((selector) => {
                    const box = rect(selector);
                    return box && box.top >= stage.top - 1 && box.bottom <= stage.bottom + 1;
                }),
                apiClipped: document.querySelector('#apiHeader').scrollWidth > document.querySelector('#apiHeader').clientWidth + 1,
                topbarClipped: topbarControls.some((item) => item.clipped),
                apiOverlap: topbarControls.some((item) => intersects(api, item)),
                sidebarBottom: rect('.workspace-sidebar-card').bottom,
                shellBottom: rect('.workspace-shell').bottom
            };
        });

        expect(voiceMetrics.contentBottom, `${viewport.name} Voice content bottom`).toBeLessThanOrEqual(voiceMetrics.stage.bottom + 1);
        expect(voiceMetrics.requiredCardsVisible, `${viewport.name} required Voice cards`).toBe(true);
        expect(voiceMetrics.apiClipped, `${viewport.name} API label`).toBe(false);
        expect(voiceMetrics.topbarClipped, `${viewport.name} topbar labels`).toBe(false);
        expect(voiceMetrics.apiOverlap, `${viewport.name} API overlap`).toBe(false);
        expect(Math.abs(voiceMetrics.sidebarBottom - voiceMetrics.shellBottom), `${viewport.name} sidebar height`).toBeLessThanOrEqual(1);

        const iconGeometry = await page.locator('.workspace-nav-btn .workspace-nav-icon').evaluateAll((icons) => icons.map((icon) => {
            const box = icon.getBoundingClientRect();
            return { left: Math.round(box.left), width: Math.round(box.width) };
        }));
        expect(new Set(iconGeometry.map((item) => item.left)).size, `${viewport.name} nav icon left offsets`).toBe(1);
        expect(new Set(iconGeometry.map((item) => item.width)).size, `${viewport.name} nav icon widths`).toBe(1);

        await selectWorkspaceView(page, 'capture', viewport);
        await page.waitForTimeout(350);
        const captureOverlap = await page.evaluate(() => {
            const orb = document.querySelector('.rec-orb-stage')?.getBoundingClientRect();
            const header = document.querySelector('.transcript-panel .tp-header')?.getBoundingClientRect();
            return !!orb && !!header
                && orb.left < header.right && orb.right > header.left
                && orb.top < header.bottom && orb.bottom > header.top;
        });
        expect(captureOverlap, `${viewport.name} Capture overlap`).toBe(false);

        await selectWorkspaceView(page, 'memory', viewport);
        await page.waitForTimeout(350);
        const memoryMetrics = await page.evaluate(() => {
            const pills = Array.from(document.querySelectorAll('[data-workspace-view="memory"] .pill-btn'))
                .filter((el) => {
                    const box = el.getBoundingClientRect();
                    return box.width > 0 && box.height > 0;
                })
                .map((el) => {
                    const box = el.getBoundingClientRect();
                    return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, height: box.height };
                });
            const intersections = pills.flatMap((first, index) => pills.slice(index + 1)
                .filter((second) => first.left < second.right && first.right > second.left
                    && first.top < second.bottom && first.bottom > second.top));
            return { pills, intersections: intersections.length };
        });
        expect(memoryMetrics.intersections, `${viewport.name} Memory pill intersections`).toBe(0);
        expect(memoryMetrics.pills.every((pill) => Math.abs(pill.height - 28) <= 1), `${viewport.name} Memory pill heights`).toBe(true);
        await expectActiveViewVerticallyReachable(page, `${viewport.name} Memory reachability`);
    }
});

test('expanded desktop states remain scrollable without clipping', async ({ page }) => {
    const viewport = { name: 'compact-desktop', width: 1280, height: 720 };
    await loadWorkspace(page, viewport);
    await selectWorkspaceView(page, 'voice', viewport);
    await page.waitForTimeout(350);

    await page.evaluate(() => {
        const prompt = document.querySelector('#voicePrimePrompt');
        const progress = document.querySelector('#voicePrimeProgress');
        if (prompt) prompt.hidden = false;
        if (progress) progress.hidden = false;
        const longText = 'Long Voice transcript content. '.repeat(180);
        document.querySelector('#voiceUser').textContent = longText;
        document.querySelector('#voiceReply').textContent = longText;
    });
    await expectActiveViewVerticallyReachable(page, 'compact-desktop expanded Voice');

    const scrollMetrics = await page.locator('.workspace-view-stage').evaluate((stage) => ({
        clientHeight: stage.clientHeight,
        scrollHeight: stage.scrollHeight,
        overflowY: getComputedStyle(stage).overflowY
    }));
    expect(scrollMetrics.scrollHeight).toBeGreaterThan(scrollMetrics.clientHeight);
    expect(['auto', 'scroll']).toContain(scrollMetrics.overflowY);

    await page.locator('#apiHeader').click();
    await expect(page.locator('#apiPanel')).toHaveClass(/open/);
    const apiMetrics = await page.locator('#apiPanel').evaluate((panel) => {
        const box = panel.getBoundingClientRect();
        return {
            left: box.left,
            right: box.right,
            top: box.top,
            bottom: box.bottom,
            overflowY: getComputedStyle(panel).overflowY,
            scrollHeight: panel.scrollHeight,
            clientHeight: panel.clientHeight
        };
    });
    expect(apiMetrics.left).toBeGreaterThanOrEqual(0);
    expect(apiMetrics.right).toBeLessThanOrEqual(viewport.width + 1);
    expect(apiMetrics.top).toBeGreaterThanOrEqual(0);
    expect(apiMetrics.bottom).toBeLessThanOrEqual(viewport.height + 1);
    if (apiMetrics.scrollHeight > apiMetrics.clientHeight + 1) {
        expect(['auto', 'scroll']).toContain(apiMetrics.overflowY);
    }
    await page.locator('#apiHeader').click();

    await page.locator('#workspaceSidebarCollapseBtn').click();
    await expect(page.locator('body')).toHaveClass(/sidebar-collapsed/);
    await expectNoDocumentHorizontalOverflow(page, 'compact-desktop collapsed sidebar');
    await expectActiveViewVerticallyReachable(page, 'compact-desktop collapsed sidebar');

    await page.locator('#assistantLauncher').click();
    await expect(page.locator('#assistantShell')).toHaveClass(/open/);
    await expect(page.locator('#assistantPanel')).toBeVisible();
    await expectNoDocumentHorizontalOverflow(page, 'compact-desktop assistant open');
    await expectActiveViewVerticallyReachable(page, 'compact-desktop assistant open');
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
