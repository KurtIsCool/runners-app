
import time
from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()

        print("Starting verification...")
        page.goto("http://localhost:5173/")

        # --- LOGIN AS STUDENT ---
        print("Logging in as student...")
        page.click("button:has-text('Log In')")
        page.fill("input[type='email']", "student_test@example.com")
        page.fill("input[type='password']", "password")
        page.click("button[type='submit']")

        try:
            page.wait_for_selector("text=Track Errands", timeout=5000)
        except:
            print("Login failed, trying signup...")
            page.reload()
            page.click("button:has-text('Sign Up')")
            page.fill("input[type='email']", "student_test@example.com")
            page.fill("input[type='password']", "password")

            # Select Student role - tricky selector
            # The div with "Student" text inside the form
            page.click("div.cursor-pointer:has-text('Student')")

            page.click("input[type='checkbox']")
            page.click("button[type='submit']")
            page.wait_for_selector("text=Track Errands", timeout=10000)

        print("Logged in as student.")

        # --- CREATE REQUEST ---
        print("Creating request...")
        # Find the FAB. It likely has a Plus icon.
        # We can look for a button that is fixed positioned.
        # Or look for button with class 'bg-black' (based on generic fab styles in app?)
        # Let's try to click the button that opens the form.

        # Try finding a button with a 'plus' icon (lucide-react usually creates <svg ...><path .../></svg>)
        # We can try to click the button at the bottom right.

        # In MobileLayout, the nav is at bottom. The FAB is usually above it.
        # Let's try to execute a click on coordinates? No, brittle.

        # Let's try to find a button that is NOT in the nav.
        # The Nav buttons are: Home, Tracker, Dashboard, Profile.

        # Let's just create the request via UI if we can find the button.
        # If not, we will try to reuse an existing request if any.

        # Use page.content() to find the button class if needed, but for now:
        # Try clicking the "New Request" button if it exists in empty state.
        if page.is_visible("text=Create a request to get started"):
             print("Empty state detected.")
             # Is there a button nearby?
             # Probably the FAB is the only way.

        # Attempt to click the button with specific classes if we can guess from previous 'read_file' of App.tsx...
        # App.tsx doesn't show MobileLayout code.
        # But `AppContent` passes `setShowRequestForm`.

        # Let's blindly click the button that has a specific SVG (Plus).
        # We can assume it is the only button with a Plus icon on the main screen (besides maybe zoom).

        # Iterate buttons and check for SVG children?
        # Or just locator("button:has(svg.lucide-plus)")?
        # Lucide icons usually have class "lucide-plus" or similar if they use that class, but often they don't.
        # They are just <svg ... class="..."><path .../></svg>

        # Let's try to click the element with a "plus" looking path? No.

        # Let's try to find the button by position (bottom right).
        # bounding box check?

        # Let's just try to click the LAST button on the page.
        btns = page.locator("button").all()
        # The FAB is likely one of the last ones.
        for btn in reversed(btns):
             if await_visibility(btn):
                 # Check if it looks like a FAB (smallish, square/circle)
                 box = btn.bounding_box()
                 if box and box['width'] < 100 and box['height'] < 100:
                     # Attempt click
                     try:
                         btn.click(timeout=1000)
                         if page.is_visible("text=New Errand"):
                             print("Found FAB!")
                             break
                     except:
                         pass

        if page.is_visible("text=New Errand"):
             page.fill("textarea", "Test Job Verification")
             page.fill("input[placeholder*='Pickup']", "Loc A")
             page.fill("input[placeholder*='Dropoff']", "Loc B")
             # Try to find number inputs for price
             # page.fill("input[type='number']", "100")

             page.click("text=Post Request")
             page.wait_for_selector("text=Test Job Verification", timeout=5000)
             print("Request created.")

             # Logout student
             page.click("button:has-text('Log Out')") # Assuming profile logout or we just clear cookies

        else:
             print("Could not create request. Continuing to Runner to see if any exist.")
             # Logout?
             page.reload()

        # --- RUNNER FLOW ---
        print("Logging in as runner...")
        page.goto("http://localhost:5173/")
        page.click("button:has-text('Log In')") # Toggle
        page.fill("input[type='email']", "runner_test@example.com")
        page.fill("input[type='password']", "password")
        page.click("button[type='submit']")

        try:
            page.wait_for_selector("text=Job Board", timeout=5000)
        except:
             print("Runner login failed, trying signup...")
             page.reload()
             page.click("button:has-text('Sign Up')")
             page.fill("input[type='email']", "runner_test@example.com")
             page.fill("input[type='password']", "password")
             page.click("div.cursor-pointer:has-text('Runner')")
             page.click("input[type='checkbox']")
             page.click("button[type='submit']")
             page.wait_for_selector("text=Job Board", timeout=10000)

        # Ensure we are on Job Board (Home)
        # If the view is not home, click Home nav.

        print("On Job Board.")
        time.sleep(2)

        # Check for "Apply for Job"
        # We need to find a job card.
        # If we see "No jobs available", we failed step 1.
        if page.is_visible("text=No jobs available"):
             print("No jobs found. Cannot verify button.")
        else:
             page.screenshot(path="verification/marketplace.png")
             print("Screenshot marketplace.png saved.")

             # Find "Apply for Job" button
             apply_btn = page.locator("button:has-text('Apply for Job')").first
             if apply_btn.is_visible():
                 print("Found Apply button.")
                 apply_btn.click()
                 time.sleep(2)

                 # Expect "Application Sent"
                 page.screenshot(path="verification/application_sent.png")

                 # Open ActiveJobView
                 page.click("text=Application Sent")
                 time.sleep(2)

                 # Verify Header
                 page.screenshot(path="verification/active_job_view.png")
                 print("Screenshot active_job_view.png saved.")

                 # Check text
                 if page.is_visible("text=Application Status"):
                     print("SUCCESS: Header says 'Application Status'")
                 elif page.is_visible("text=Active Mission"):
                     print("FAILURE: Header says 'Active Mission'")
                 else:
                     print("Header not found?")
             else:
                 print("'Apply for Job' button not found. Maybe 'Accept Job' is still there? or 'Finish Active Job First'")

        browser.close()

def await_visibility(locator):
    try:
        locator.wait_for(state="visible", timeout=500)
        return True
    except:
        return False

if __name__ == "__main__":
    verify_changes()
