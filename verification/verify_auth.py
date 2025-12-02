from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)

        # 1. Desktop Auth Screen
        page = browser.new_page(viewport={"width": 1280, "height": 720})
        page.goto("http://localhost:3000")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/1_auth_desktop.png")

        # 2. Signup T&C
        try:
            page.click("button:has-text('Sign Up')")
            page.wait_for_timeout(500)
            page.screenshot(path="verification/2_auth_signup_tc.png")
        except Exception as e:
            print(f"Signup Error: {e}")

        # 3. Mobile Auth Screen
        ctx_mobile = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True)
        page_mobile = ctx_mobile.new_page()
        page_mobile.goto("http://localhost:3000")
        page_mobile.wait_for_timeout(1000)
        page_mobile.screenshot(path="verification/3_auth_mobile.png")

        browser.close()

if __name__ == "__main__":
    run()
