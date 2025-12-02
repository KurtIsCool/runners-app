import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True)
        page = context.new_page()

        page.goto("http://localhost:3000")
        page.wait_for_timeout(2000)

        # Signup
        print("Signup...")
        page.click("text=Sign Up")
        page.wait_for_timeout(500)
        email = f"student_{int(time.time())}@test.com"
        page.fill("input[type='email']", email)
        page.fill("input[type='password']", "password123")
        page.click(".grid >> text=Student")
        page.check("input#terms")
        page.click("button:has-text('Create Account')")

        page.wait_for_selector("text=Create New Request", timeout=10000)

        # Create Request 1
        print("Creating Request 1...")
        page.click("text=Create New Request")
        page.wait_for_selector("text=Post Request")
        page.fill("input[placeholder*='Jollibee']", "Store")
        page.fill("input[placeholder*='Dorm']", "Room")
        page.fill("textarea", "Burger")
        page.fill("input[type='number']", "100")
        page.click("button:has-text('Post Request')")

        # Wait for form to close
        try:
            page.wait_for_selector("text=Post Request", state="hidden", timeout=5000)
            print("Form closed successfully.")
        except:
            print("Form did not close! Taking screenshot of errors.")
            page.screenshot(path="verification/error_form_not_closed.png")
            raise

        # Wait for Tracker view
        page.wait_for_timeout(2000)
        page.screenshot(path="verification/debug_tracker_1.png")

        # Check if "No active errands" is present (BAD)
        if page.locator("text=No active errands").is_visible():
            print("ERROR: Request was not created (Tracker shows empty).")
        else:
            print("SUCCESS: Request created.")

        # Reload and create second
        page.reload()
        page.wait_for_selector("text=Create New Request")

        print("Creating Request 2...")
        page.click("text=Create New Request")
        page.wait_for_selector("text=Post Request")
        page.fill("input[placeholder*='Jollibee']", "Store")
        page.fill("input[placeholder*='Dorm']", "Room")
        page.fill("textarea", "Pizza")
        page.fill("input[type='number']", "100")
        page.click("button:has-text('Post Request')")

        try:
            page.wait_for_selector("text=Post Request", state="hidden", timeout=5000)
        except:
            page.screenshot(path="verification/error_form_not_closed_2.png")
            raise

        print("Created 2 requests successfully.")
        browser.close()

if __name__ == "__main__":
    run()
