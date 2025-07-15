import { defineConfig } from 'tsup'
import fs from 'fs'
import path from 'path'

/**
 * A cooperative cleanup handler for SIGINT (Ctrl+C).
 * It performs cleanup and then allows the process to terminate gracefully.
 *
 * clean on Ctrl+C
 * // pnpm turbo dev --filter="@tiptap/react"
 */

const cleanupOnExit = () => {
  // IMPORTANT: Unregister this listener to prevent an infinite loop
  // if we re-raise the signal to exit.
  process.removeListener('SIGINT', cleanupOnExit)

  /*
  /// console writing many attempts not working will deal w later
  const writeToConsole = (msg: string) => fs.writeSync(1, `${msg}\n`);

  writeToConsole('\n🛑 Watch process terminated. Cleaning up dist directory...');
  */
  const distPath = path.resolve(process.cwd(), 'dist')
  
  try {
    if (fs.existsSync(distPath)) {
      // Recursively delete the entire 'dist' directory.
      fs.rmSync(distPath, { recursive: true, force: true })
      // writeToConsole(`✅ Cleaned up: ${distPath}`);
    }
  } catch (error) {
    // For errors, write to the stderr file descriptor (2).
    // const errorMsg = `❌ Error cleaning up ${distPath}: ${error}\n`;
    // fs.writeSync(2, errorMsg);
  }

  // After our cleanup, re-raise the SIGINT signal. This allows the process
  // to terminate with its default behavior, which is what the script runner
  // expects. This is more cooperative than calling `process.exit()` directly.
  process.kill(process.pid, 'SIGINT')
}

// Register the global cleanup handler for the SIGINT signal.
process.on('SIGINT', cleanupOnExit)

export default defineConfig(
  ['src/index.ts', 'src/content/index.ts', 'src/menus/index.ts'].map(entry => ({
    entry: [entry],
    tsconfig: '../../tsconfig.build.json',
    outDir: `dist${entry.replace('src', '').split('/').slice(0, -1).join('/')}`,
    dts: true,
    sourcemap: true,
    format: ['esm', 'cjs'],
    external: [/^[^./]/],
  })),
)
