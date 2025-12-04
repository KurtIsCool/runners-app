
import time
from playwright.sync_api import sync_playwright

def verify_dispute_flow():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # Use a larger viewport to ensure desktop view
        context = browser.new_context(viewport={"width": 1280, "height": 800})
        page = context.new_page()

        print("Navigating to login...")
        page.goto("http://localhost:5173")

        # 1. Login as Student
        print("Logging in as Student...")
        # Toggle Log In if needed (it matches "Log In" text)
        page.click("button:has-text('Log In')")
        page.fill("input[type='email']", "student@example.com")
        page.fill("input[type='password']", "password")
        page.click("button:has-text('Sign In')")

        # Wait for Student Home
        print("Waiting for Student Home...")
        page.wait_for_selector("text=Create New Request", timeout=20000)

        # 2. Create a Request
        print("Creating Request...")
        page.click("text=Create New Request")
        page.fill("textarea[name='details']", "Test dispute item")
        page.click("button:has-text('Submit Request')")

        # Wait for tracker view
        page.wait_for_selector("text=Track Errands", timeout=10000)

        # Logout
        print("Logging out Student...")
        page.click("button:has-text('Log out')")

        # 3. Signup as Runner
        print("Signing up Runner...")
        page.click("button:has-text('Sign Up')") # Click Toggle
        runner_email = f"runner_{int(time.time())}@test.com"
        page.fill("input[type='email']", runner_email)
        page.fill("input[type='password']", "password")

        # Select Runner role
        page.click("button:has-text('Runner')")
        # Click Sign Up button (which might say "Sign Up ->")
        # The submit button text depends on state. In AuthScreen:
        # <button ...>{isLogin ? 'Sign In' : 'Sign Up'} <ArrowRight ... /></button>
        # So it should be "Sign Up"
        page.click("button:has-text('Sign Up') >> nth=-1") # The button at bottom

        print("Waiting for Job Board...")
        page.wait_for_selector("text=Job Board", timeout=20000)

        # 4. Accept the job
        print("Accepting Job...")
        # There might be multiple jobs. Accept the first one.
        # Find a button that says "Accept Job"
        page.click("button:has-text('Accept Job') >> nth=0")

        # 5. Process job to Delivered
        print("Processing Job...")
        # "Start Purchasing"
        page.click("button:has-text('Start Purchasing')")
        # "Start Delivering"
        page.click("button:has-text('Start Delivering')")
        # "Upload Proof & Finish"
        page.click("button:has-text('Upload Proof & Finish')")

        # Create a dummy file
        with open("proof.jpg", "wb") as f:
            f.write(b"dummy image content")

        page.set_input_files("input[type='file']", "proof.jpg")

        # Wait for upload to simulate? The component updates state on change.
        # Then click "Submit Proof"
        page.click("button:has-text('Submit Proof')")

        # Status should be 'delivered'
        page.wait_for_selector("text=Waiting for Student Confirmation")

        # Logout Runner
        print("Logging out Runner...")
        page.click("button:has-text('Log out')")

        # 6. Login Student and Dispute
        print("Logging in Student to Dispute...")
        page.click("button:has-text('Log In')")
        page.fill("input[type='email']", "student@example.com")
        page.fill("input[type='password']", "password")
        page.click("button:has-text('Sign In')")

        page.wait_for_selector("text=Track Errands", timeout=20000)

        # Find the request (it should be 'delivered')
        # Click "Dispute"
        print("Disputing...")
        page.on("dialog", lambda dialog: dialog.accept("Wrong item delivered"))
        page.click("button:has-text('Dispute')")

        # Verify status changes to Disputed
        print("Verifying Dispute Status...")
        page.wait_for_selector("text=Disputed")

        # Screenshot Student Side
        page.screenshot(path="/home/jules/verification/student_disputed.png")

        # Logout Student
        page.click("button:has-text('Log out')")

        # 7. Login Runner and Verify Unblocked
        print("Logging in Runner to Verify Unblocked...")
        page.click("button:has-text('Log In')")
        page.fill("input[type='email']", runner_email)
        page.fill("input[type='password']", "password")
        page.click("button:has-text('Sign In')")

        # Should NOT see Active Job modal (stuck). Should see Job Board.
        print("Verifying Job Board is visible...")
        page.wait_for_selector("text=Job Board", timeout=20000)

        # Check Dashboard for Disputed Item
        print("Navigating to Dashboard...")
        # Desktop Sidebar "Dashboard"
        if page.is_visible("text=Dashboard"):
             page.click("text=Dashboard")
        else:
             print("Dashboard link not found, assuming mobile layout?")

        # Check for "Action Required / Disputed"
        print("Verifying Disputed Section...")
        page.wait_for_selector("text=Action Required / Disputed")

        page.screenshot(path="/home/jules/verification/runner_disputed_view.png")
        print("Verification Successful!")

        browser.close()

if __name__ == "__main__":
    verify_dispute_flow()
