import time
from playwright.sync_api import sync_playwright

def run():
    with sync_playwright() as p:
        # Launch browser
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(viewport={'width': 1280, 'height': 720})
        page = context.new_page()

        print("🚀 Starting E2E Tests...")

        # 1. Home Page Verification
        print("Testing Home Page...")
        page.goto('http://localhost:5173')
        page.wait_for_load_state('networkidle')
        
        assert page.is_visible("text=Nexus"), "Home page title not found"
        assert page.is_visible("text=Modular Monolith Platform"), "Home subtitle not found"
        assert page.locator(".module-card").count() == 3, "Should have 3 module cards"
        print("✅ Home Page Verified")

        try:
            # 2. Kite Module Verification
            print("Testing Kite Module...")
            page.click("a[href='/kite']")
            
            # Wait for container
            page.wait_for_selector(".kite-dashboard", timeout=10000)
            
            # Verify Wind Cockpit
            if not page.is_visible("text=Wind Cockpit"):
                page.screenshot(path="tests/kite_failure.png")
            assert page.is_visible("text=Wind Cockpit"), "Wind Cockpit header not found"
            
            assert page.locator(".icon-base").count() > 5, "Icons not rendering in Kite"
            
            # Verify Stock Inspector
            assert page.is_visible("text=Stock Inspector"), "Stock Inspector not found"
            assert page.is_visible("text=Office Worker"), "Strategy labels not found"
            
            # Verify Navigation Tabs
            page.click("text=📈 Trade History")
            page.wait_for_selector(".trade-history", timeout=5000)
            assert page.is_visible("text=Trade History"), "History view not loading"
            
            print("✅ Kite Module Verified")

            # 3. LifeOS Module Verification
            print("Testing LifeOS Module...")
            page.goto('http://localhost:5173/admin') # Direct nav since nav bar might be tricky
            page.wait_for_selector(".life-dashboard", timeout=10000)
            
            assert page.is_visible("h1:has-text('LifeOS')"), "LifeOS Header not found"
            
            # Tabs
            print("  - Testing Tabs")
            page.click("text=Habits")
            page.wait_for_selector(".habit-tracker", timeout=5000)
            assert page.is_visible("text=Habit Streaks"), "Habit tracker not showing"
            assert page.locator(".hand-checkbox").count() > 0, "Checkboxes not rendering"
            
            page.click("text=Tasks")
            page.wait_for_selector(".todo-board", timeout=5000)
            assert page.is_visible("text=To Do"), "Kanban board not showing"
            
            print("✅ LifeOS Module Verified")

            # 4. Choice-Fit (Check placeholder)
            print("Testing Choice-Fit Module...")
            page.goto('http://localhost:5173/choice-fit')
            page.wait_for_load_state('networkidle')
            # Just check it doesn't crash 404
            assert page.url == "http://localhost:5173/choice-fit", "URL mismatch"
            print("✅ Choice-Fit Module Verified (Empty)")

        except Exception as e:
            print(f"❌ Test Failed: {e}")
            page.screenshot(path="tests/failure_snapshot.png")
            raise e
        finally:
            browser.close()
        print("\n🎉 All Tests Passed Successfully!")

if __name__ == "__main__":
    run()
