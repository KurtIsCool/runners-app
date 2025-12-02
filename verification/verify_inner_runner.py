import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Mobile view
        context = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True)
        page = context.new_page()

        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        # 1. Signup Runner
        print("Signup Runner...")
        page.click("text=Sign Up")
        timestamp = int(time.time())
        email = f"runner_{timestamp}@test.com"
        page.fill("input[type='email']", email)
        page.fill("input[type='password']", "password123")

        # Select Runner
        page.click(".grid >> text=Runner")
        page.check("input#terms")
        page.click("button:has-text('Create Account')")

        # Wait for Marketplace
        print("Waiting for Marketplace...")
        try:
            page.wait_for_selector("text=Job Board", timeout=10000)
        except:
            page.screenshot(path="verification/error_signup_runner.png")
            raise

        print("Marketplace loaded.")
        page.screenshot(path="verification/8_runner_marketplace.png")

        # 3. Accept ONE job
        print("Accepting a job...")
        accept_btn = page.locator("button:has-text('Accept Job')").first
        if accept_btn.count() == 0:
            print("No jobs found!")
            page.screenshot(path="verification/error_no_jobs.png")
            return

        accept_btn.click()
        page.wait_for_timeout(1000)

        # 4. Verify Active Job Logic
        print("Verifying Single Job Logic...")
        page.screenshot(path="verification/9_runner_active_job.png")

        disabled_btns = page.locator("button:has-text('Finish Active Job First')")
        count = disabled_btns.count()
        print(f"Found {count} disabled buttons.")

        if count > 0:
            print("SUCCESS: Other jobs are disabled.")
        else:
             print("WARNING: No other jobs visible to verify disabled state.")

        if page.locator("text=Mission in Progress").is_visible():
            print("Active Job Banner is visible.")

        # 5. Verify Dashboard/History
        print("Checking Dashboard/History...")
        # Label is 'Jobs' for Runner
        page.click("button:has-text('Jobs')")
        page.wait_for_timeout(1000)
        page.screenshot(path="verification/10_runner_history.png")

        print("Runner verification complete.")
        browser.close()

if __name__ == "__main__":
    run()
