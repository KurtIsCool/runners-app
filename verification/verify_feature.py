from playwright.sync_api import sync_playwright

def verify_app():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 375, 'height': 812})
        page = context.new_page()

        # Listen for errors
        page.on("console", lambda msg: print(f"CONSOLE: {msg.text}"))
        page.on("pageerror", lambda exc: print(f"PAGE ERROR: {exc}"))

        # Navigate
        try:
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")
            page.wait_for_timeout(2000)

            page.screenshot(path="verification/debug_screenshot.png")
            print("Debug screenshot taken.")
        except Exception as e:
            print(f"Script Error: {e}")

        browser.close()

if __name__ == "__main__":
    verify_app()
