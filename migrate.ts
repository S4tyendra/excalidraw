import * as fs from "fs"
import * as path from "path"

const changeImports = (content: string) => {
    let newContent = content.replace(/"use client"\n?/g, "")
    newContent = newContent.replace(/'use client'\n?/g, "")
    // navigation
    newContent = newContent.replace(/import\s+{([^}]*)}\s+from\s+"next\/navigation"/g, "import {$1} from 'react-router-dom'")
    newContent = newContent.replace(/useRouter\(\)/g, "useNavigate()")
    newContent = newContent.replace(/router\.push/g, "navigate")
    newContent = newContent.replace(/usePathname\(\)/g, "useLocation().pathname")
    newContent = newContent.replace(/useParams\(\)/g, "useParams()")
    
    // next/link
    newContent = newContent.replace(/import Link from "next\/link"/g, "import { Link } from 'react-router-dom'")
    newContent = newContent.replace(/<Link href=/g, "<Link to=")

    // next/head
    newContent = newContent.replace(/import Head from "next\/head"/g, "")
    newContent = newContent.replace(/<Head>[\s\S]*?<\/Head>/g, "<></>")
    
    // next/dynamic
    if (newContent.includes('next/dynamic')) {
        newContent = newContent.replace(/import dynamic from "next\/dynamic"/g, "import { lazy, Suspense } from 'react'")
        newContent = newContent.replace(/const (\w+) = dynamic(?:<[^>]*>)?\(\(\) => import\((.*?)\), .*?\)/g, "const $1Loader = lazy(() => import($2)); const $1 = (props: any) => <Suspense fallback={<div/>}><$1Loader {...props} /></Suspense>")
    }

    // next/image
    newContent = newContent.replace(/import Image from "next\/image"/g, "")
    newContent = newContent.replace(/<Image([^>]*?)\/>/g, "<img$1/>")

    // remove font imports
    newContent = newContent.replace(/import {[^}]*} from "next\/font\/google"\w*;/g, "")
    newContent = newContent.replace(/import {[^}]*} from "next\/font\/google"\n/g, "")
    newContent = newContent.replace(/import {[^}]*} from "geist\/font\/sans"\w*;/g, "")
    newContent = newContent.replace(/import {[^}]*} from "geist\/font\/sans"\n/g, "")
    newContent = newContent.replace(/import {[^}]*} from "geist\/font\/mono"\w*;/g, "")
    newContent = newContent.replace(/import {[^}]*} from "geist\/font\/mono"\n/g, "")

    return newContent
}

const walkDir = (dir: string) => {
    if (!fs.existsSync(dir)) return
    const files = fs.readdirSync(dir)
    for (const file of files) {
        const fullPath = path.join(dir, file)
        if (fs.statSync(fullPath).isDirectory()) {
            walkDir(fullPath)
        } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
            const content = fs.readFileSync(fullPath, 'utf8')
            const replaced = changeImports(content)
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
console.log("Done rewriting imports!")
