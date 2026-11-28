from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "email-preview-screenshots"
OUT.mkdir(exist_ok=True)
PREVIEW = (ROOT / "email-preview.html").resolve().as_uri()

with sync_playwright() as p:
    browser = p.chromium.launch()
    page = browser.new_page(viewport={"width": 1440, "height": 1100}, device_scale_factor=1)
    page.goto(PREVIEW, wait_until="load")
    page.locator("article iframe").nth(0).wait_for()
    page.wait_for_function("document.querySelectorAll('article iframe').length === 6")

    labels = ["customer-confirmation", "staff-alert", "confirmed", "packed", "delivered", "declined"]
    for width, viewport in [(600, 1440), (360, 400)]:
        page.set_viewport_size({"width": viewport, "height": 1100})
        for index, label in enumerate(labels):
            article = page.locator("article").nth(index)
            frame_el = article.locator("iframe")
            article.evaluate("(el, w) => { el.style.width = w + 'px'; el.style.maxWidth = 'none'; el.style.margin = '0 auto'; }", width)
            frame_el.evaluate("(el, w) => { el.style.width = w + 'px'; el.style.maxWidth = 'none'; el.style.height = '1200px'; }", width)
            frame = frame_el.content_frame
            frame.locator("body").wait_for()
            frame.evaluate("() => Promise.all(Array.from(document.images).map(img => img.complete ? Promise.resolve() : new Promise(resolve => { img.onload = resolve; img.onerror = resolve; })))")
            height = frame.evaluate("() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight)")
            frame_el.evaluate("(el, h) => { el.style.height = h + 'px'; }", height)
            frame_el.screenshot(path=str(OUT / f"{label}-{width}px.png"))
    browser.close()

print(f"Saved 12 email screenshots in {OUT}")
