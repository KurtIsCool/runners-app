
import time
from playwright.sync_api import sync_playwright

def verify_changes():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={"width": 375, "height": 812})
        page = context.new_page()

        print("Starting verification with MOCK data...")
        page.goto("http://localhost:5173/")

        # We are logged in automatically as Runner due to mocked App.tsx
        # Wait for Job Board
        try:
            page.wait_for_selector("text=Job Board", timeout=10000)
            print("Job Board loaded.")
        except:
            print("Failed to load Job Board. Check console.")
            # Maybe auth screen is still showing if mock failed?
            if page.is_visible("text=Sign In"):
                print("Auth screen visible, mock didn't bypass login?")

        # 1. Verify Marketplace "Apply for Job" button
        # There should be a job 'job_open' (requested)
        page.screenshot(path="verification/marketplace_mock.png")

        # Check if button "Apply for Job" exists
        apply_btn = page.locator("button:has-text('Apply for Job')")
        if apply_btn.count() > 0:
            print("SUCCESS: Found 'Apply for Job' button.")
        else:
            print("FAILURE: 'Apply for Job' button not found.")
            # Check for 'Accept Job'
            if page.locator("button:has-text('Accept Job')").count() > 0:
                print("FAILURE: 'Accept Job' button still exists.")

        # 2. Verify ActiveJobView header
        # There should be a banner for 'job_applied' (pending_runner)
        # Banner says "Application Sent"
        if page.locator("text=Application Sent").is_visible():
            print("Found 'Application Sent' banner.")
            page.click("text=Application Sent")

            # Wait for modal
            page.wait_for_selector("text=Application Status")
            time.sleep(1)
            page.screenshot(path="verification/active_job_view_mock.png")

            if page.locator("text=Application Status").is_visible():
                print("SUCCESS: Header is 'Application Status'.")
            elif page.locator("text=Active Mission").is_visible():
                print("FAILURE: Header is 'Active Mission'.")
            else:
                print("Header not found.")
        else:
            print("Banner not found. Maybe user logic in mock is wrong? user.id vs runner_id")

        browser.close()

if __name__ == "__main__":
    verify_changes()
