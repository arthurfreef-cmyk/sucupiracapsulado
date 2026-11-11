"""Verify the sales-page path only; block every payment endpoint."""
import asyncio
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from playwright.async_api import async_playwright

SCREENSHOTS = Path('/tmp/browser/precheckout')

async def main():
    SCREENSHOTS.mkdir(parents=True, exist_ok=True)
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        for width, height in [(1280, 1800), (390, 844), (320, 844)]:
            context = await browser.new_context(viewport={"width": width, "height": height})
            page = await context.new_page()
            errors = []
            charges = []
            page.on('pageerror', lambda error: errors.append(str(error)))
            async def block_payment(route):
                charges.append(route.request.url)
                await route.abort()
            await page.route('**/api/*pix*', block_payment)
            await page.route('http://localhost:3001/tracking/v1/events**', lambda r: r.fulfill(json={"lead": {}, "event": {}}))
            for kit in ['k1', 'k3', 'k5']:
                await page.goto('http://localhost:8080/?utm_source=review&utm_campaign=path&fbclid=review-click', wait_until='domcontentloaded')
                await page.get_by_role('link', name='QUERO ME LIVRAR DAS DORES →', exact=True).click()
                # Wait for native smooth scrolling, including delayed vendor initialization.
                await page.wait_for_timeout(1800)
                assert await page.locator('#precos').evaluate('(e)=>e.getBoundingClientRect().top >= 64')
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                if kit == 'k1':
                    await page.screenshot(path=str(SCREENSHOTS / f'pricing-{width}.png'))
                await page.evaluate('''() => {
                    window.fbq = (...args) => {
                        if (args[1] === 'AddToCart') throw new Error('Blocked purchase pixel');
                    };
                }''')
                await page.locator(f'a[href*="/checkout/{kit}"]').click()
                await page.wait_for_url(f'**/checkout/{kit}?**')
                await page.locator('#name').wait_for()
                query = parse_qs(urlparse(page.url).query)
                assert query['utm_source'] == ['review']
                assert query['utm_campaign'] == ['path']
                assert query['fbclid'] == ['review-click']
                assert await page.evaluate('document.documentElement.scrollWidth <= innerWidth')
                if kit == 'k1':
                    await page.screenshot(path=str(SCREENSHOTS / f'checkout-{width}.png'))
            assert not charges, charges
            assert not errors, errors
            print(f'PASS {width}px: hero to kits, all 3 checkouts, campaign parameters, isolated pixel failure, no overflow or charges')
            await context.close()
        await browser.close()

asyncio.run(main())