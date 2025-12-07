from playwright.sync_api import sync_playwright

def verify_cancellation():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        # We need to simulate a mobile or desktop view. Let's try desktop.
        page = browser.new_page(viewport={'width': 1280, 'height': 720})

        # Navigate to the app
        page.goto("http://localhost:3000")

        # We might need to handle the "login" if the app redirects.
        # Based on App.tsx, it shows AuthScreen if !user.
        # We can try to simulate a login or mock the state if possible, but interacting with Supabase auth might be tricky without a real user.
        # However, the goal is to see the UI. If we can't login, we can't see the cancellation button.

        # Wait for page load
        page.wait_for_timeout(3000)

        # Take a screenshot of the initial state (likely login screen)
        page.screenshot(path="verification/initial_load.png")
        print("Initial screenshot taken.")

        browser.close()

if __name__ == "__main__":
    verify_cancellation()
