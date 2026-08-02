/**
 * Test registration script
 * Run: node scripts/test-register.mjs
 * 
 * This script tests the registration endpoint and logs the full response
 * so you can see exactly what the backend returns.
 */

const API_URL = "https://api.xerinmarketplace.com/api/v1"

// Test data — change these values as needed
const testData = {
  first_name: "Test",
  last_name: "User",
  email: `testuser${Date.now()}@example.com`,
  phone: "+255712345678",
  password: "TestPass123",
}

async function main() {
  console.log("=== Registration Test ===")
  console.log(`API URL: ${API_URL}`)
  console.log(`Endpoint: ${API_URL}/auth/register`)
  console.log("Request body:", JSON.stringify(testData, null, 2))
  console.log("")

  try {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testData),
    })

    console.log(`Status: ${res.status} ${res.statusText}`)
    console.log(`Headers:`, Object.fromEntries(res.headers.entries()))
    console.log("")

    const text = await res.text()
    try {
      const json = JSON.parse(text)
      console.log("Response body (JSON):")
      console.log(JSON.stringify(json, null, 2))
    } catch {
      console.log("Response body (raw):")
      console.log(text || "(empty)")
    }

    if (res.ok) {
      console.log("\n✅ Registration SUCCESS!")
    } else {
      console.log("\n❌ Registration FAILED!")
      console.log("   Check the error details above to see what went wrong.")
    }
  } catch (err) {
    console.error("\n💥 NETWORK ERROR — Cannot reach the backend!")
    console.error("   Error:", err.message)
    console.error("")
    console.error("   Possible causes:")
    console.error("   1. Backend is not running — start it with: uvicorn api.main:api --reload")
    console.error("   2. Wrong API URL — check NEXT_PUBLIC_API_URL in .env.local")
    console.error("   3. Backend is on a different port — default is 8000")
    console.error(`   4. Check if ${API_URL} is accessible`)
  }

  // Also test health endpoint
  console.log("\n=== Health Check ===")
  try {
    const healthRes = await fetch(API_URL.replace("/api/v1", ""))
    const healthText = await healthRes.text()
    console.log(`Health status: ${healthRes.status}`)
    console.log(`Health response: ${healthText}`)
    if (healthRes.ok) {
      console.log("✅ Backend is reachable!")
    }
  } catch (err) {
    console.error("❌ Backend is NOT reachable at", API_URL.replace("/api/v1", ""))
    console.error("   Error:", err.message)
  }
}

main()
