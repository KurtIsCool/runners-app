from playwright.sync_api import sync_playwright

def verify_frontend():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Emulate a mobile device
        context = browser.new_context(viewport={"width": 375, "height": 812}, is_mobile=True, has_touch=True)
        page = context.new_page()

        try:
            print("Navigating to app...")
            page.goto("http://localhost:3000")
            page.wait_for_load_state("networkidle")

            # 1. Verify Auth Screen Mobile Layout
            print("Verifying Auth Screen Mobile...")
            page.screenshot(path="verification/1_auth_mobile.png")

            # Switch to Desktop
            print("Verifying Auth Screen Desktop...")
            context_desktop = browser.new_context(viewport={"width": 1280, "height": 720})
            page_desktop = context_desktop.new_page()
            page_desktop.goto("http://localhost:3000")
            page_desktop.wait_for_load_state("networkidle")
            page_desktop.screenshot(path="verification/2_auth_desktop.png")

            # 2. Login as Student
            print("Logging in as Student...")
            page_desktop.fill("input[type='email']", "student@example.com")
            page_desktop.fill("input[type='password']", "password")
            page_desktop.click("button:has-text('Sign In')")
            page_desktop.wait_for_load_state("networkidle")
            page_desktop.screenshot(path="verification/3_student_home.png")

            # 3. Request Form
            print("Opening Request Form...")
            page_desktop.click("button:has-text('Create New Request')")
            page_desktop.wait_for_selector("text=Create Request")
            page_desktop.screenshot(path="verification/4_request_form.png")
            page_desktop.click("button:has-text('Post Request')") # Attempt to submit
            # Close modal
            page_desktop.click("button.bg-gray-100")

            # 4. Mobile Layout (Student)
            print("Mobile Student View...")
            page.fill("input[type='email']", "student@example.com")
            page.fill("input[type='password']", "password")
            page.click("button:has-text('Sign In')")
            page.wait_for_load_state("networkidle")
            page.screenshot(path="verification/5_mobile_student_home.png")

            # Check navbar position (Logo left, Profile right)
            # We can visually verify in screenshot 5.

            # 5. Profile & Static Pages
            print("Navigating to Profile...")
            page.click("text=Profile")
            page.wait_for_selector("text=More")
            page.screenshot(path="verification/6_mobile_profile.png")

            print("Navigating to About Us...")
            page.click("text=About Us")
            page.wait_for_selector("text=About Us")
            page.screenshot(path="verification/7_about_us.png")

            # Back to profile
            page.click("text=Back")

            # 6. Runner View
            # Logout
            # page.click("text=Sign Out")
            # Login as Runner... skipping for now to keep it simple, verifying UI structure mainly.

        except Exception as e:
            print(f"Error: {e}")
            import traceback
            traceback.print_exc()
        finally:
            browser.close()

if __name__ == "__main__":
    verify_frontend()
