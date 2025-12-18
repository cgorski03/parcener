import { cn } from "@/lib/utils"
import { Check, Copy, Network } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"

const INITIAL_CODE = [
    '// wrangler.jsonc',
    '{',
    '  "name": "parcener-api",',
    '  "compatibility_date": "2024-09-23",',
    '  "vars": {',
    '    // Database connection',
    '    "DB_URL": "libsql://..."',
    '  }',
    '}'
]

export function VimConfigCard() {
    const [lines, setLines] = useState<string[]>(INITIAL_CODE)
    const [cursor, setCursor] = useState({ row: 5, col: 0 })
    const [mode, setMode] = useState<'NORMAL' | 'INSERT'>('NORMAL')
    const [isFocused, setIsFocused] = useState(false)
    const [copied, setCopied] = useState(false)
    const containerRef = useRef<HTMLDivElement>(null)

    // Helper to clamp cursor within bounds
    const clamp = (r: number, c: number, curMode: 'NORMAL' | 'INSERT', curLines: string[]) => {
        const maxRow = curLines.length - 1
        const safeRow = Math.max(0, Math.min(r, maxRow))
        const lineLen = curLines[safeRow].length
        // In Normal mode, cursor is on char (0 to len-1). In Insert, can be after char (0 to len).
        const maxCol = curMode === 'NORMAL' ? Math.max(0, lineLen - 1) : lineLen
        const safeCol = Math.max(0, Math.min(c, maxCol))
        return { row: safeRow, col: safeCol }
    }

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (!isFocused) return
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', ' '].includes(e.key) ||
            (mode === 'NORMAL' && ['j', 'k', 'h', 'l'].includes(e.key))) {
            e.preventDefault()
        }

        setCursor(prev => {
            let { row, col } = prev
            const currentLine = lines[row]

            // --- INSERT MODE ---
            if (mode === 'INSERT') {
                if (e.key === 'Escape') {
                    setMode('NORMAL')
                    // Move cursor back one char when exiting insert, strictly like Vim
                    return clamp(row, col - 1, 'NORMAL', lines)
                }
                if (e.key === 'Backspace') {
                    if (col > 0) {
                        const newLine = currentLine.slice(0, col - 1) + currentLine.slice(col)
                        const newLines = [...lines]
                        newLines[row] = newLine
                        setLines(newLines)
                        return { row, col: col - 1 }
                    }
                }
                if (e.key === 'Enter') {
                    // Simple newline support
                    const newLines = [...lines]
                    const indent = currentLine.match(/^\s*/)?.[0] || ''
                    newLines.splice(row + 1, 0, indent)
                    setLines(newLines)
                    return { row: row + 1, col: indent.length }
                }
                if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
                    const newLine = currentLine.slice(0, col) + e.key + currentLine.slice(col)
                    const newLines = [...lines]
                    newLines[row] = newLine
                    setLines(newLines)
                    return { row, col: col + 1 }
                }
                return prev
            }

            // --- NORMAL MODE ---
            switch (e.key) {
                case 'h': return clamp(row, col - 1, 'NORMAL', lines)
                case 'l': return clamp(row, col + 1, 'NORMAL', lines)
                case 'j': return clamp(row + 1, col, 'NORMAL', lines)
                case 'k': return clamp(row - 1, col, 'NORMAL', lines)
                case '$': return clamp(row, Infinity, 'NORMAL', lines)
                case '0': return { row, col: 0 }
                case 'i':
                    setMode('INSERT')
                    return prev
                case 'a':
                    setMode('INSERT')
                    return clamp(row, col + 1, 'INSERT', lines) // Move cursor right to append
                case 'x':
                    if (currentLine.length > 0) {
                        const newLine = currentLine.slice(0, col) + currentLine.slice(col + 1)
                        const newLines = [...lines]
                        newLines[row] = newLine
                        setLines(newLines)
                        // Re-clamp cursor in case we deleted last char
                        return clamp(row, col, 'NORMAL', newLines)
                    }
                    return prev
                case 'd':
                    // Very hacky check for double 'd' would go here, 
                    // for now let's just make 'D' delete line to keep it simple or skip
                    return prev
            }
            return prev
        })
    }, [isFocused, lines, mode])

    const copyConfig = (e: React.MouseEvent) => {
        e.stopPropagation()
        navigator.clipboard.writeText(lines.join('\n'))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    // Handle outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsFocused(false)
                setMode('NORMAL') // Auto exit insert on blur
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    return (
        <div
            ref={containerRef}
            className={cn(
                "border bg-slate-900 text-slate-50 rounded-xl p-8 flex flex-col justify-between h-full min-h-[400px] overflow-hidden relative transition-all duration-300",
                isFocused ? "ring-2 ring-primary/50 shadow-2xl " : "hover:border-slate-700"
            )}
            onClick={() => setIsFocused(true)}
        >
            <div className="space-y-4 relative z-10 pointer-events-none">
                <div className="h-10 w-10 bg-white/10 text-white rounded-lg flex items-center justify-center">
                    <Network className="h-5 w-5" />
                </div>
                <h3 className="text-xl font-bold tracking-tight">Built on Cloudflare Workers</h3> <p className="text-slate-400 text-sm leading-relaxed">  Instant, affordable scalability.
                </p>
            </div>

            {/* Neovim Editor Surface */}
            <div
                className="mt-8 relative group cursor-text outline-none"
                tabIndex={0}
                onKeyDown={(e) => handleKeyDown(e)}
            >
                {/* Window Bar */}
                <div className="rounded-t-md bg-[#1e293b] border-x border-t border-slate-700 p-4 font-mono text-[10px] leading-relaxed shadow-xl min-h-[160px]">
                    <div className="flex">
                        {/* Line Numbers */}
                        <div className="flex flex-col text-slate-600 select-none pr-4 text-right min-w-[24px]">
                            {lines.map((_, i) => <span key={i}>{i + 1}</span>)}
                        </div>
                        {/* Code Content */}
                        <div className="flex-1 overflow-x-auto whitespace-pre font-medium">
                            {lines.map((line, rowIndex) => (
                                <div key={rowIndex} className="relative h-[15px]"> {/* Fixed height for alignment */}
                                    {line.length === 0 && rowIndex === cursor.row && isFocused ? (
                                        <span className={cn(
                                            "absolute left-0 top-0 w-2 h-4 bg-slate-400 opacity-70",
                                            mode === 'NORMAL' ? "block" : "w-[1px] bg-white"
                                        )} />
                                    ) : null}

                                    {line.split('').map((char, colIndex) => {
                                        const isCursor = isFocused && rowIndex === cursor.row && colIndex === cursor.col

                                        // Syntax Highlighting logic (very basic)
                                        let colorClass = "text-slate-300"
                                        if (line.startsWith('#')) colorClass = "text-slate-500"
                                        else if (line.startsWith('[')) colorClass = "text-purple-400"
                                        else if (char === '"' || (line.includes('"') && !line.startsWith('name') && !line.startsWith('compat') && !line.startsWith('DB'))) {
                                            // Crude string detection
                                            colorClass = "text-green-400"
                                        } else if (['name', 'compatibility_date', 'DB_URL'].some(k => line.startsWith(k)) && colIndex < line.indexOf('=')) {
                                            colorClass = "text-blue-400"
                                        }

                                        return (
                                            <span key={colIndex} className="relative">
                                                {isCursor && (
                                                    <span className={cn(
                                                        "absolute inset-0 bg-slate-400 opacity-70",
                                                        mode === 'INSERT' && "w-[2px] bg-white opacity-100"
                                                    )} />
                                                )}
                                                <span className={colorClass}>{char}</span>
                                            </span>
                                        )
                                    })}

                                    {/* Cursor at end of line handling */}
                                    {isFocused && rowIndex === cursor.row && cursor.col === line.length && (
                                        <span className={cn(
                                            "absolute ml-[1px] inline-block h-4 bg-slate-400 opacity-70",
                                            mode === 'NORMAL' ? "w-2" : "w-[2px] bg-white opacity-100"
                                        )}>&nbsp;</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="rounded-b-md bg-slate-700 text-[10px] font-mono flex items-center shadow-xl border-x border-b border-slate-700 select-none">
                    <div className={cn(
                        "text-slate-900 font-bold px-2 py-0.5 uppercase transition-colors",
                        mode === 'NORMAL' ? "bg-green-500" : "bg-blue-500"
                    )}>
                        {mode}
                    </div>
                    <div className="px-2 text-slate-300 flex gap-2">
                        <span>master</span>
                        {isFocused ? <span>+</span> : null}
                    </div>
                    <div className="px-2 text-slate-400 flex-1 truncate text-center">parcener/wrangler.toml</div>
                    <div className="bg-slate-600 px-2 py-0.5 text-slate-200">utf-8</div>
                    <div className="bg-slate-500 text-white px-2 py-0.5 min-w-[50px] text-center">
                        {cursor.row + 1}:{cursor.col + 1}
                    </div>
                </div>

                <button
                    onClick={copyConfig}
                    className="absolute top-2 right-2 text-slate-500 hover:text-white transition-colors p-2 z-20"
                    title="Copy Config"
                >
                    {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </button>
            </div>
        </div>
    )
}
