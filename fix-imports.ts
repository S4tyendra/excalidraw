import * as fs from "fs"
import * as path from "path"

const walkDir = (dir: string) => {
    if (!fs.existsSync(dir)) return
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const fullPath = path.join(dir, file)
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath)
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8')
            let replaced = content
            
            // Fix useRouter -> useNavigate inside imports
            replaced = replaced.replace(/import\s*{([^}]*)}\s*from\s*['"]react-router-dom['"]/g, (match, p1) => {
                let inner = p1
                inner = inner.replace(/\buseRouter\b/g, 'useNavigate')
                inner = inner.replace(/\busePathname\b/g, 'useLocation')
                return `import { ${inner} } from 'react-router-dom'`
            })
            
            if (content !== replaced) {
                fs.writeFileSync(fullPath, replaced, 'utf8')
                console.log(`Updated ${fullPath}`)
            }
        }
    }
}

walkDir("app")
walkDir("components")
walkDir("lib")
console.log("Fixes applied.")
