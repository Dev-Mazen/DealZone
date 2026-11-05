import { execFile } from 'child_process'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE_URL = 'http://localhost:5180'

function dumpDom(url) {
  return new Promise((resolve, reject) => {
    execFile(
      CHROME_PATH,
      [
        '--headless=new',
        '--disable-gpu',
        '--no-sandbox',
        '--virtual-time-budget=3000',
        '--dump-dom',
        url,
      ],
      { maxBuffer: 10 * 1024 * 1024, timeout: 15000 },
      (err, stdout, stderr) => {
        if (err) reject(err)
        else resolve({ stdout, stderr })
      }
    )
  })
}

async function runAudit() {
  console.log('====================================================')
  console.log('REAL BROWSER HEADLESS AUDIT (CHROME headless=new)')
  console.log('Target:', BASE_URL)
  console.log('====================================================\n')

  const testRoutes = [
    {
      name: 'Landing Page',
      path: '/',
      expectedText: ['DEALZONE', 'B2B', 'Egypt', 'Industrial'],
    },
    {
      name: 'Login Page',
      path: '/login',
      expectedText: ['Email', 'Password', 'Sign in', 'Log in'],
    },
    {
      name: 'Register Page',
      path: '/register',
      expectedText: ['Full Name', 'Email', 'Password', 'Create Account'],
    },
    {
      name: 'Forgot Password Page',
      path: '/forgot-password',
      expectedText: ['Forgot', 'Email', 'Reset'],
    },
    {
      name: 'Protected Route (Dashboard without Auth redirects to Login)',
      path: '/dashboard',
      expectedText: ['Welcome back', 'Sign in', 'Email'],
    },
    {
      name: 'Protected Admin Route without Auth redirects to Login',
      path: '/admin',
      expectedText: ['Welcome back', 'Sign in', 'Email'],
    },
  ]

  let passed = 0
  let failed = 0

  for (const route of testRoutes) {
    const fullUrl = `${BASE_URL}${route.path}`
    try {
      const { stdout } = await dumpDom(fullUrl)
      const hasRoot = stdout.includes('id="root"')
      const checks = route.expectedText.map((term) => ({
        term,
        found: stdout.toLowerCase().includes(term.toLowerCase()),
      }))

      const allFound = checks.every((c) => c.found)

      if (hasRoot && allFound) {
        console.log(`✅ [PASS] ${route.name} (${route.path})`)
        console.log(`   DOM Size: ${stdout.length} bytes | Verified tokens: ${route.expectedText.join(', ')}`)
        passed++
      } else {
        console.error(`❌ [FAIL] ${route.name} (${route.path})`)
        console.error(`   Root rendered: ${hasRoot}`)
        console.error('   Token results:', checks)
        failed++
      }
    } catch (err) {
      console.error(`❌ [ERROR] ${route.name}: ${err.message}`)
      failed++
    }
  }

  console.log('\n====================================================')
  console.log(`Browser Audit Summary: ${passed} Passed, ${failed} Failed`)
  console.log('====================================================')
  process.exit(failed > 0 ? 1 : 0)
}

runAudit()
